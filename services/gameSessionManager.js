const sessions = new Map();

function buildReasonLabel(reason, gameType) {
  switch (reason) {
    case "replaced":
      return `Partie de \`${gameType}\` remplacée.`;
    case "expired":
      return `Partie de \`${gameType}\` expirée.`;
    case "completed":
      return `Partie de \`${gameType}\` terminée.`;
    case "cancelled":
    default:
      return `Partie de \`${gameType}\` annulée.`;
  }
}

async function runCleanup(session, context) {
  const cleanupTasks = Array.from(session.cleanupTasks);
  session.cleanupTasks.clear();

  for (const task of cleanupTasks) {
    try {
      await task(context);
    } catch (error) {
      console.error(
        `[sessionManager] Cleanup error for ${session.gameType}:`,
        error
      );
    }
  }
}

function createSession({
  channelId,
  gameType,
  message,
  data = {},
  durationMs = 120000,
  onExpire,
}) {
  const session = {
    channelId,
    gameType,
    message,
    data: { ...data },
    createdAt: Date.now(),
    timeoutId: null,
    cleanupTasks: new Set(),
    ended: false,
    addCleanup(fn) {
      if (typeof fn === "function") {
        this.cleanupTasks.add(fn);
      }
    },
    set(key, value) {
      this.data[key] = value;
    },
    get(key) {
      return this.data[key];
    },
  };

  if (durationMs > 0) {
    session.timeoutId = setTimeout(async () => {
      const activeSession = sessions.get(channelId);
      if (activeSession !== session || session.ended) {
        return;
      }

      await cancelSession(channelId, "expired");

      if (typeof onExpire === "function") {
        try {
          await onExpire(message, session);
        } catch (error) {
          console.error(
            `[sessionManager] onExpire error for ${gameType}:`,
            error
          );
        }
      }
    }, durationMs);

    session.addCleanup(() => {
      if (session.timeoutId) {
        clearTimeout(session.timeoutId);
        session.timeoutId = null;
      }
    });
  }

  return session;
}

async function startSession(options) {
  const { channelId, gameType } = options;
  const previousSession = sessions.get(channelId) || null;

  if (previousSession) {
    await cancelSession(channelId, "replaced", { replacedBy: gameType });
  }

  const session = createSession(options);
  sessions.set(channelId, session);
  return { session, previousSession };
}

function getSession(channelId) {
  return sessions.get(channelId) || null;
}

function getSessionForGame(channelId, gameType) {
  const session = getSession(channelId);
  if (!session || session.gameType !== gameType) {
    return null;
  }
  return session;
}

async function cancelSession(channelId, reason = "cancelled", details = {}) {
  const session = sessions.get(channelId);
  if (!session) {
    return null;
  }

  session.ended = true;
  sessions.delete(channelId);

  const context = {
    reason,
    details,
    summary: buildReasonLabel(reason, session.gameType),
  };

  await runCleanup(session, context);
  return session;
}

module.exports = {
  startSession,
  getSession,
  getSessionForGame,
  cancelSession,
};

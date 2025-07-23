const Notification = require("../models/NotificationModel");

// Funzione helper per prevenire duplicati
async function findExistingNotification(
  userId,
  type,
  fromUserId,
  relatedId = null
) {
  const query = {
    userId,
    type,
    fromUserId,
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // ultime 24 ore
  };

  // Per i commenti, controlla anche l'artwork specifico
  if (type === "NewComment" && relatedId) {
    // Assumiamo che tu abbia un campo per l'artwork ID nel messaggio o aggiungi un campo
    query.message = { $regex: `artwork.*${relatedId}` };
  }

  return await Notification.findOne(query);
}

async function notifyNewFollower(followerId, followeeId) {
  try {
    // Evita auto-notifiche
    if (followerId.toString() === followeeId.toString()) {
      return null;
    }

    // Controlla duplicati
    const existing = await findExistingNotification(
      followeeId,
      "NewFollower",
      followerId
    );

    if (existing) {
      console.log("Notifica follower duplicata evitata");
      return existing;
    }

    return await Notification.create({
      userId: followeeId,
      type: "NewFollower",
      message: "You have a new follower!",
      fromUserId: followerId,
    });
  } catch (error) {
    console.error("Errore notifica nuovo follower:", error);
    return null;
  }
}

async function notifyNewComment(commenterId, artworkOwnerId, artworkId, artworkName) {
  try {
    // Evita auto-notifiche
    if (commenterId.toString() === artworkOwnerId.toString()) {
      return null;
    }

    // Controlla duplicati - stesso utente, stesso artwork, ultime 24h
    const existing = await Notification.findOne({
      userId: artworkOwnerId,
      type: "NewComment",
      fromUserId: commenterId,
      message: { $regex: artworkId.toString() },
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    if (existing) {
      console.log("Notifica commento duplicata evitata");
      return existing;
    }

    return await Notification.create({
      userId: artworkOwnerId,
      type: "NewComment",
      message: `Someone commented on your artwork ${artworkName}`,
      fromUserId: commenterId,
    });
  } catch (error) {
    console.error("Errore notifica nuovo commento:", error);
    return null;
  }
}

async function notifyNewLike(likerId, artworkOwnerId, artworkId, artworkName) {
  try {
    // Evita auto-notifiche
    if (likerId.toString() === artworkOwnerId.toString()) {
      return null;
    }

    // Controlla duplicati - stesso utente, stesso artwork, ultime 24h
    const existing = await Notification.findOne({
      userId: artworkOwnerId,
      type: "NewLike",
      fromUserId: likerId,
      message: { $regex: artworkId.toString() },
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    if (existing) {
      console.log("Notifica like duplicata evitata");
      return existing;
    }

    return await Notification.create({
      userId: artworkOwnerId,
      type: "NewLike",
      message: `Someone liked your artwork ${artworkName}`,
      fromUserId: likerId,
    });
  } catch (error) {
    console.error("Errore notifica nuovo like:", error);
    return null;
  }
}

// Funzione per pulire notifiche vecchie (opzionale, da chiamare periodicamente)
async function cleanOldNotifications(daysOld = 30) {
  try {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
    });
    console.log(`Eliminate ${result.deletedCount} notifiche vecchie`);
    return result;
  } catch (error) {
    console.error("Errore pulizia notifiche:", error);
  }
}

module.exports = {
  notifyNewFollower,
  notifyNewComment,
  notifyNewLike,
  cleanOldNotifications,
};

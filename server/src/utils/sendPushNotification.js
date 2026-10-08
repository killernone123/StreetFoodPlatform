async function sendPushNotification({
  token,
  title,
  body,
  data = {},
}) {
  try {
    if (!token) {
      console.log("❌ Push token missing");
      return null;
    }

    const message = {
      to: token,
      sound: "default",
      title,
      body,
      data,
    };

    const response = await fetch(
      "https://exp.host/--/api/v2/push/send",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      }
    );

    const result = await response.json();

    console.log(
      "📲 EXPO PUSH RESPONSE:",
      JSON.stringify(result, null, 2)
    );

    return result;
  } catch (error) {
    console.error(
      "❌ EXPO PUSH SEND ERROR:",
      error
    );

    return null;
  }
}

module.exports = {
  sendPushNotification,
};
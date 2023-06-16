import admin from "firebase-admin";
import { BatchResponse } from "firebase-admin/lib/messaging";
import Users from "../../models/user.model";

import serviceAccount from "./cargo-dealer-dev-firebase-adminsdk-8clut-8d64c4d561";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

class FCM {
  private messaging = admin.messaging();

  public async sendToDevice(
    deviceToken: string,
    title: string,
    body: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      let message;
      // check if its ios or android

      // if (deviceToken.length === 163) {
      //   message = {
      //     notification: {
      //       title,
      //       body,
      //     },
      //     android: {
      //       priority: "high",
      //     },
      //     token: deviceToken,
      //   };
      // } else if (deviceToken.length === 64) {
      //   message = {
      //     notification: {
      //       title,
      //       body,
      //     },
      //     apns: {
      //       payload: {
      //         aps: {
      //           sound: "default",
      //           "content-available": 1,
      //           "mutable-content": 1,
      //         },
      //       },
      //     },
      //     token: deviceToken,
      //   };
      // } else {
      //   return reject("Invalid device token");
      // }

      message = {
        notification: {
          title,
          body,
        },
        token: deviceToken,
      };

      this.messaging
        .send(message)
        .then((response: any) => {
          resolve(response);
        })
        .catch((error: any) => {
          console.log(`Error sending message: ${error}`);
          reject(error);
        });
    });
  }

  public async sendToTopic(
    topic: string,
    title: string,
    body: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const message = {
        notification: {
          title,
          body,
        },
        topic,
      };

      this.messaging
        .send(message)
        .then((response: any) => {
          resolve(response);
        })
        .catch((error: any) => {
          console.log(`Error sending message: ${error}`);
          reject(error);
        });
    });
  }

  public async sendToMultipleDevices(
    deviceTokens: string[],
    title: string,
    body: string
  ): Promise<string | BatchResponse> {
    return new Promise((resolve, reject) => {
      const message = {
        notification: {
          title,
          body,
        },
        tokens: deviceTokens,
      };

      this.messaging
        .sendMulticast(message)
        .then((response: any) => {
          resolve(response);
        })
        .catch((error: any) => {
          console.log(`Error sending message: ${error}`);
          reject(error);
        });
    });
  }

  public async sendToAllUserDevices({
    _id,
  }: {
    _id: string;
    message: {
      title: string;
      body: string;
    };
  }) {
    return new Promise((resolve, reject) => {
      try {
        // const user =
      } catch {
        return reject("Error sending message");
      }
    });
  }
}

// const messaging = admin.messaging();

// const deviceToken = "your-device-token";

// const message = {
//   notification: {
//     title: "Hello",
//     body: "World",
//   },
//   token: deviceToken,
// };

// messaging
//   .send(message)
//   .then((response:any) => {
//     console.log(`Successfully sent message: ${response}`);
//   })
//   .catch((error:any) => {
//     console.log(`Error sending message: ${error}`);
//   });

export const Admin = admin;
export default new FCM();

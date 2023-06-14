import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as sgMail from "@sendgrid/mail";
admin.initializeApp();

// Set your SendGrid API key
sgMail.setApiKey("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");

exports.sendInviteEmail = functions.firestore
  .document("bikebusgroups/{groupId}")
  .onUpdate(async (change: functions.Change<functions.firestore.DocumentSnapshot>, context: functions.EventContext) => {
    const newValue = change.after.data();
    const previousValue = change.before.data();

    if (newValue && previousValue && JSON.stringify(newValue.BikeBusInvites) !== JSON.stringify(previousValue.BikeBusInvites)) {
      const bikebusgroupRef = admin.firestore().collection("bikebusgroups").doc(context.params.groupId);
      const bikebusgroupSnap = await bikebusgroupRef.get();
      const bikebusgroup = bikebusgroupSnap.data();

      if (bikebusgroup) {
        const msg = {
          to: newValue.BikeBusInvites[newValue.BikeBusInvites.length - 1],
          from: "craigm26@gmail.com", // Change to your verified sender
          subject: "Invitation to join BikeBus Group",
          text: `You have been invited to join the BikeBus group "${bikebusgroup.name}". The route is "${bikebusgroup.route}", and the schedule is "${bikebusgroup.schedule}".`,
        };

        try {
          await sgMail.send(msg);
          console.log("Mail sent successfully");
        } catch (error) {
          console.error("Error while sending mail: ", error);
        }
      }
    }
  });

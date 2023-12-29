/* eslint-disable @typescript-eslint/no-var-requires */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as sgMail from "@sendgrid/mail";

interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
}

admin.initializeApp();

// Set your SendGrid API key
sgMail.setApiKey("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");

exports.sendInviteEmail = functions.firestore
  .document("bikebusgroups/{groupId}")
  .onUpdate(async (change: functions.Change<functions.firestore.DocumentSnapshot>, context: functions.EventContext) => {
    const newValue = change.after.data();
    const previousValue = change.before.data();

    if (newValue && previousValue && JSON.stringify(newValue.BikeBusInvites) !== JSON.stringify(previousValue.BikeBusInvites)) {
      const groupId = context.params.groupId;
      console.log("groupId", groupId);
      const bikebusgroupRef = admin.firestore().collection("bikebusgroups").doc(context.params.groupId);
      const bikebusgroupSnap = await bikebusgroupRef.get();
      const bikebusgroup = bikebusgroupSnap.data();

      console.log("bikebusgroup", bikebusgroup);      

      if (bikebusgroup) {
        const invites = newValue.BikeBusInvites;
        const latestInvite = invites[invites.length - 1]; // Get the latest invite email

        const msg = {
          to: latestInvite,
          from: "invitation@bikebus.app", // Change to your verified sender
          subject: "Invitation to join BikeBus Group",
          html: `
          <p>You have been invited to join the BikeBus group <strong><a href="https://bikebus.app/bikebusgrouppage/${groupId}">${bikebusgroup?.BikeBusName}</a></strong>.</p>
          <p>Click on the link to view the group and then click on the "Join Group" button to join the group.</p>
          <p>Thanks,</p>
          <p>BikeBus and Craig Merry</p>
          <p><a href="https://bikebus.app">https://bikebus.app</a></p>
          <p>This is an automated email. Please do not reply to this email.</p>

          `,
        };

        console.log("To:", msg.to);
        console.log("From:", msg.from);
        console.log("Subject:", msg.subject);
        console.log("HTML:", msg.html);

        try {
          await sgMail.send(msg);
          console.log("Mail sent successfully");
        } catch (error) {
          console.error("Error while sending mail: ", error);
        }
      }
    }
  });


const fetchAndStoreNewsArticles = async (query: string) => {
  const Parser = require("rss-parser");

  const parser = new Parser();
  const rssFeedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  const feed = await parser.parseURL(rssFeedUrl);

  const newsArticles = feed.items.map((item: { title: unknown; link: unknown; pubDate: unknown; }) => ({
    title: item.title,
    link: item.link,
    pubDate: item.pubDate,
  } as NewsArticle));

  const batch = admin.firestore().batch();
  newsArticles.forEach((article: unknown) => {
    const docRef = admin.firestore().collection("newsArticles").doc(); // Generating a new doc ID
    batch.set(docRef, article);
  });

  await batch.commit();
  console.log(`News articles for query "${query}" written to Firestore.`);
};

exports.scheduledFetchNewsArticles = functions.pubsub.schedule("every 24 hours").onRun(async _context => {
  await fetchAndStoreNewsArticles("BIKEBUS");
  await fetchAndStoreNewsArticles("BiciBus");
  await fetchAndStoreNewsArticles("Bike Train");
  console.log("Scheduled fetch and store of news articles complete.");
});
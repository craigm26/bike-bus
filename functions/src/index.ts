/* eslint-disable @typescript-eslint/no-var-requires */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as sgMail from "@sendgrid/mail";
import axios from "axios";
const cors = require("cors")({ origin: true });
import { format } from "date-fns";




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

const getWebpageMetadata = async (url: string): Promise<{title: string, description: string, image: string}> => {
  try {
    const { data: html } = await axios.get(url);
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const descMatch = html.match(/<meta name="description" content="(.*?)"/i);
    const imageMatch = html.match(/<meta property="og:image" content="(.*?)"/i);

    const title = titleMatch ? titleMatch[1] : "No title found";
    const description = descMatch ? descMatch[1] : "No description found";
    const image = imageMatch ? imageMatch[1] : "";

    return { title, description, image };
  } catch (error) {
    console.error("Error retrieving webpage metadata:", error);
    throw new Error("Error retrieving webpage metadata");
  }
};


exports.fetchWebpageMetadata = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    if (request.method === "POST" && request.body.url) {
      getWebpageMetadata(request.body.url)
        .then(metadata => response.status(200).json(metadata))
        .catch(error => {
          console.error("Error fetching webpage metadata:", error);
          response.status(500).send("Error fetching webpage metadata");
        });
    } else {
      response.status(400).send("Bad Request. Please POST with a url parameter.");
    }
  });
});

exports.sendWeeklySummary = functions.pubsub.schedule("every monday 09:45").timeZone("America/Los_Angeles").onRun(async context => {
  try {
    // Fetch articles from the last week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const articlesSnapshot = await admin.firestore().collection("newsArticles")
      .where("timestamp", ">=", oneWeekAgo)
      .get();

    const articles = articlesSnapshot.docs.map(doc => doc.data());

    // Fetch subscribers
    const subscribersSnapshot = await admin.firestore().collection("users")
      .where("isSubscribed", "==", true)
      .get();

    const subscribers = subscribersSnapshot.docs.map(doc => doc.data());

    // Send email to each subscriber
    subscribers.forEach(async (subscriber) => {
      const emailContent = articles.map(article => 
        `<li><a href="${article.link}">${article.title}</a> - Posted on ${format(article.timestamp.toDate(), "PPP")}</li>`
      ).join("");

      const msg = {
        to: subscriber.email,
        from: "newsletter@bikebus.app",
        subject: "Weekly News Summary",
        html: `
            <style>    
                .BikeBusFont {
                    font-family: 'Indie-Flower', sans-serif;
                }
            </style>
            <div style="background-color: #ffd800; color: black; text-align: center; padding: 10px;" class="BikeBusFont">
                <span style="font-size: 24px;">BikeBus</span>
            </div>
            <h1>Weekly News Summary</h1>
            <ul>${emailContent}</ul>
            <p>Check out more articles on our <a href="https://bikebus.app/news">News Page</a>.</p>
            <p>Thanks,</p>
            <p>BikeBus and Craig Merry</p>
            <p><a href="https://bikebus.app">https://bikebus.app</a></p>
            <p>To unsubscribe from this newsletter, please <a href="https://bikebus.app/news">click here</a> and then select "Unsubscribe" after logging in.</p>
        `,
      };
    
      try {
        await sgMail.send(msg);
      } catch (error) {
        console.error("Error sending email to subscriber:", subscriber.email, error);
      }
    });

    console.log("Weekly summary email sent successfully.");
  } catch (error) {
    console.error("Error sending weekly summary:", error);
  }
});
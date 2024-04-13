/* eslint-disable @typescript-eslint/no-var-requires */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as sgMail from "@sendgrid/mail";
import axios from "axios";
const cors = require("cors");
import { format } from "date-fns";

// import the sendgrid api key from the .env.local or production file




interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
}

admin.initializeApp();

const SENDGRID_API_KEY = functions.config().sendgrid.key;
sgMail.setApiKey(SENDGRID_API_KEY);

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

const geocodeAddress = async (address: string | number | boolean) => {
  const apiKey = functions.config().google.geocoding_api_key;
  

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    const results = response.data.results;
    if (results.length > 0) {
      const components = results[0].address_components;
      const addressDetails = {
        street: components.find((c: { types: string | string[]; }) => c.types.includes("route"))?.long_name || "",
        city: components.find((c: { types: string | string[]; }) => c.types.includes("locality"))?.long_name || "",
        state: components.find((c: { types: string | string[]; }) => c.types.includes("administrative_area_level_1"))?.short_name || "",
        zip: components.find((c: { types: string | string[]; }) => c.types.includes("postal_code"))?.long_name || "",
        country: components.find((c: { types: string | string[]; }) => c.types.includes("country"))?.long_name || ""
      };
      return addressDetails;
    }
    return {};
  } catch (error) {
    console.error("Error geocoding address:", error);
    return {};
  }
};


const getAddressCache = async (address: string | number | boolean) => {
  if (!address || typeof address !== "string" || address.trim() === "") {
    console.log("Invalid or empty address:", address);
    return null; // Return null or handle the case appropriately
  }

  const cacheRef = admin.firestore().collection("addressCache").doc(encodeURIComponent(address));
  try {
    const doc = await cacheRef.get();
    return doc.exists ? doc.data() : null;
  } catch (error) {
    console.error("Error accessing address cache:", error);
    return null;
  }
};


const cacheAddress = async (address: string | number | boolean, details: admin.firestore.WithFieldValue<admin.firestore.DocumentData>) => {
  const cacheRef = admin.firestore().collection("addressCache").doc(encodeURIComponent(address));
  await cacheRef.set(details);
};


exports.updateRouteAddressDetails = functions.firestore
  .document("routes/{routeId}")
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const previousData = change.before.data();

    if (newData.endPointAddress !== previousData.endPointAddress) {
      let addressDetails = await getAddressCache(newData.endPointAddress);
    
      if (!addressDetails) {
        addressDetails = await geocodeAddress(newData.endPointAddress);
        if (addressDetails && Object.keys(addressDetails).length > 0) {
          await cacheAddress(newData.endPointAddress, addressDetails);
        }
      }

      console.log("Attempting to update route document with address details:", addressDetails);

      if (addressDetails && Object.values(addressDetails).every(value => value !== undefined)) {
        try {
          await change.after.ref.update(addressDetails);
          console.log("Route document updated successfully");
        } catch (error) {
          console.error("Failed to update route document:", error);
        }
      } else {
        console.log("Address details are invalid or incomplete:", addressDetails);
      }
    } else {
      console.log("No changes in endPointAddress, update not necessary");
    }
  });


const corsHandler = cors({ origin: true });

exports.forceUpdateAllRouteAddresses = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    if (request.method !== "POST") {
      response.status(405).send("Method Not Allowed");
    } else {
      try {
        await updateAddresses(request, response);
      } catch (error) {
        console.error("Error updating routes:", error);
        response.status(500).send("Internal Server Error");
      }
    }
  });
});

async function updateAddresses(request: functions.https.Request, response: functions.Response<any>) {
  const routesRef = admin.firestore().collection("routes");
  const snapshot = await routesRef.where("endPointAddress", "!=", null).get();

  if (snapshot.empty) {
    response.send("No routes to update.");
    return;
  }

  let count = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();

    if (!data.endPointAddress) {
      console.error("Missing endPointAddress for document:", doc.id);
      continue; // Skip to the next iteration
    }
    
    let addressDetails = await getAddressCache(data.endPointAddress);
    if (!addressDetails) {
      addressDetails = await geocodeAddress(data.endPointAddress);
      if (addressDetails) {
        await cacheAddress(data.endPointAddress, addressDetails);
      }
    }

    if (addressDetails) {
      // Prepare the update data to include an array of address details
      const updateData = {
        endPointDetails: admin.firestore.FieldValue.arrayUnion(addressDetails),
      };
      try {
        await doc.ref.update(updateData);
        console.log(`Document ${doc.id} updated with address details.`);
        count++;
      } catch (error) {
        console.error(`Failed to update document ${doc.id}:`, error);
      }
    }
  }

  response.send(`Update process completed for ${count} routes.`);
}



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

const getWebpageMetadata = async (url: string): Promise<{ title: string, description: string, image: string }> => {
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

exports.sendWeeklySummary = functions.pubsub.schedule("every wednesday 10:00").timeZone("America/Los_Angeles").onRun(async context => {
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
        from: "info@bikebus.app",
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

const GOOGLE_API_KEY = functions.config().aerialview.api_key;

exports.renderVideoProxy = functions.https.onRequest((request, response) => {
  cors(request, response, async () => {
    if (request.method !== "POST") {
      // Make sure to return a response here
      return response.status(405).send("Method Not Allowed");
    }

    const payload = request.body;

    try {
      const aerialResponse = await axios.post("https://aerialview.googleapis.com/v1:renderVideo", payload, {
        headers: {
          "Authorization": `Bearer ${functions.config().aerialview.api_key}`,
          "Content-Type": "application/json",
        },
      });
      // Make sure to return a response here
      return response.send(aerialResponse.data);
    } catch (error) {
      console.error("Error calling Aerial API:", error);
      // Make sure to return a response here
      return response.status(500).send("Internal Server Error");
    }
  });
});


// Function to render a new video
exports.renderVideo = functions.https.onCall(async (data, context) => {
  const payload = data.payload; // The payload should be passed from the client

  try {
    const response = await axios.post("https://aerialview.googleapis.com/v1:renderVideo", payload, {
      headers: {
        "Authorization": `Bearer ${GOOGLE_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const videoId = response.data.videoId;
    // You can now return this videoId to the client or proceed to check its status
    return { videoId };
  } catch (error) {
    // Handle errors appropriately
    console.error("Error rendering video:", error);
    throw new functions.https.HttpsError("internal", "Failed to render video");
  }
});

// Function to check the status of the video
exports.checkVideoStatus = functions.https.onCall(async (data, context) => {
  const videoId = data.videoId; // The videoId should be passed from the client

  try {
    const response = await axios.get(`https://aerialview.googleapis.com/v1:lookupVideoMetadata?videoId=${videoId}`, {
      headers: {
        "Authorization": `Bearer ${GOOGLE_API_KEY}`,
      },
    });

    const videoStatus = response.data.state;
    // Return the status to the client, or perform additional logic based on the status
    return { videoStatus };
  } catch (error) {
    // Handle errors appropriately
    console.error("Error checking video status:", error);
    throw new functions.https.HttpsError("internal", "Failed to check video status");
  }
});

// Function to save the video ID to Firestore
exports.saveVideoIdToFirestore = functions.https.onCall(async (data, context) => {
  const { videoId, routeId } = data; // Destructuring to extract variables from data

  // Perform a check to see if the videoId already exists and handle accordingly
  const videosRef = admin.firestore().collection("videos");
  const docRef = videosRef.doc(videoId); // Assuming videoId is unique and used as the document ID
  const docSnapshot = await docRef.get();

  if (!docSnapshot.exists) {
    // Video ID does not exist, save it to Firestore
    await docRef.set({
      routeId: routeId,
      videoId: videoId,
      // Add any other relevant data here
    });
    // Return some result to the client, if necessary
    return { success: true };
  } else {
    // Video ID already exists, handle accordingly
    // Return some result to the client, if necessary
    return { success: false, message: "Video ID already exists." };
  }
});


// Function to fetch the video URI once the video is active
exports.fetchVideoUri = functions.https.onCall(async (data, context) => {
  const videoId = data.videoId;

  try {
    const response = await axios.get(`https://aerialview.googleapis.com/v1:lookupVideo?videoId=${videoId}`, {
      headers: {
        "Authorization": `Bearer ${GOOGLE_API_KEY}`,
      },
    });

    const videoUri = response.data.videoUri;
    // Return the URI to the client
    return { videoUri };
  } catch (error) {
    // Handle errors appropriately
    console.error("Error fetching video URI:", error);
    throw new functions.https.HttpsError("internal", "Failed to fetch video URI");
  }
});

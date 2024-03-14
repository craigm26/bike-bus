import {
    IonContent,
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonItem,
    IonLabel,
    IonList,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonAlert,
    IonCol,
    IonRow,
} from '@ionic/react';
import { InputChangeEventDetail } from '@ionic/core';
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { db } from '../firebaseConfig';
import { collection, query, orderBy, getDocs, addDoc, Timestamp, DocumentData, QueryDocumentSnapshot, where, getDoc, doc, updateDoc } from 'firebase/firestore';
// what's the browser import of capacitor?
import { Browser } from '@capacitor/browser';
import { getFunctions, httpsCallable } from 'firebase/functions';



interface Article {
    id: string;
    title: string;
    content: string;
    timestamp: Timestamp;
    url?: string;
}

const News: React.FC = () => {
    const { user } = useContext(AuthContext);
    const [articles, setArticles] = useState<DocumentData[]>([]);
    const [showAlert, setShowAlert] = useState<boolean>(false);
    const [newArticleTitle, setNewArticleTitle] = useState<string>('');
    const [newArticleContent, setNewArticleContent] = useState<string>('');
    const [showEditTitle, setShowEditTitle] = useState<boolean>(false);
    const [proposedTitle, setProposedTitle] = useState<string>('');
    const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [isInfiniteDisabled, setIsInfiniteDisabled] = useState(false);
    const functions = getFunctions();
    const getWebpageMetadata = httpsCallable(functions, 'getWebpageMetadata');
    const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [titleFetchSuccess, setTitleFetchSuccess] = useState(true);




    const openLink = async (url: string) => {
        await Browser.open({ url });
    }


    const fetchAllArticles = async () => {
        const newsArticlesQuery = query(collection(db, 'newsArticles'), orderBy('timestamp', 'desc'));
        const userNewsQuery = query(collection(db, 'userNews'), orderBy('timestamp', 'desc'));

        const [newsArticlesSnapshot, userNewsSnapshot] = await Promise.all([
            getDocs(newsArticlesQuery),
            getDocs(userNewsQuery),
        ]);

        const newsArticles = newsArticlesSnapshot.docs.map(doc => ({
            ...doc.data() as Article,
            id: doc.id,
            url: doc.data().url
        }));

        const userNewsArticles = userNewsSnapshot.docs.map(doc => ({
            ...doc.data() as Article,
            id: doc.id,
            url: doc.data().url
        }));

        const combinedArticles = [...newsArticles, ...userNewsArticles];
        combinedArticles.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());

        setArticles(combinedArticles);
    };


    useEffect(() => {
        fetchAllArticles();
        checkUserSubscription();
    }, [user]);

    const checkUserSubscription = async () => {
        if (user && user.uid) {
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setIsSubscribed(userData.isSubscribed);
                } else {
                    console.log('User document not found');
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        }
    };

    const toggleSubscription = async () => {
        if (user && user.uid) {
            try {
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, { isSubscribed: !isSubscribed });
                setIsSubscribed(!isSubscribed);
            } catch (error) {
                console.error('Error updating subscription:', error);
            }
        } else {
            alert('You must be logged in to subscribe.');
        }
    };


    const fetchAndSetArticleTitle = async (url: string) => {
        if (url) {
            try {
                const { data } = await getWebpageMetadata({ url });
                return (data as any).title || '';
            } catch (error) {
                console.error('Error retrieving webpage metadata:', error);
                return '';
            }
        }
        return '';
    };

    const handleURLSubmit = async (url: string) => {
        setNewArticleContent(url);
        if (url) {
            try {
                const { data } = await getWebpageMetadata({ url });
                if (data && (data as { title: string }).title) {
                    setProposedTitle((data as { title: string }).title);
                    setTitleFetchSuccess(true); // Indicate the title was fetched successfully
                } else {
                    setProposedTitle(''); // Clear the proposed title
                    setTitleFetchSuccess(false); // Indicate the title fetch was not successful
                }
                setShowEditTitle(true); // Show the title edit field
            } catch (error) {
                console.error('Error retrieving webpage metadata:', error);
                setTitleFetchSuccess(false); // Indicate the title fetch was not successful
                setShowEditTitle(true); // Show the title edit field
            }
        }
    };
    

    // Define checkForDuplicateArticle at the top level of the component
    const checkForDuplicateArticle = async (url: string) => {
        const newsQuery = query(collection(db, 'newsArticles'), where('content', '==', url));
        const userNewsQuery = query(collection(db, 'userNews'), where('content', '==', url));
        const [newsSnapshot, userNewsSnapshot] = await Promise.all([
            getDocs(newsQuery),
            getDocs(userNewsQuery),
        ]);
        return !newsSnapshot.empty || !userNewsSnapshot.empty;
    };

    const submitUserNews = async (inputData: any) => {
        const url = inputData.url;
        const title = inputData.title || await fetchAndSetArticleTitle(url); // Use the provided title or fetch a new one

        if (!title.trim() || !url.trim()) {
            alert('You must provide both a title and content for the article.');
            return;
        }

        const isDuplicate = await checkForDuplicateArticle(url);
        if (isDuplicate) {
            alert('This link has already been submitted.');
            return;
        }

        // Here we match the Firestore structure based on the screenshot provided
        const userNews = {
            author: user.email, // Assuming that `user.email` exists in your AuthContext
            content: url,
            submittedBy: user.displayName || 'Anonymous', // Use `displayName` or a default value
            timestamp: Timestamp.now(),
            title: title,
        };

        const userNewsCollection = collection(db, 'userNews');
        await addDoc(userNewsCollection, userNews);

        // Reset states and close the alert
        setNewArticleContent('');
        setNewArticleTitle('');
        setShowAlert(false);

        // Fetch updated list of articles
        fetchAllArticles();
    };


    const handleTitleEdit = (event: CustomEvent<InputChangeEventDetail>) => {
        setProposedTitle(event.detail.value || '');
    };

    const handleTitleChange = (event: CustomEvent<InputChangeEventDetail>) => {
        setNewArticleTitle(event.detail.value || '');
    };

    const handleContentChange = async (event: CustomEvent<InputChangeEventDetail>) => {
        const url = event.detail.value || '';
        setNewArticleContent(url);

        if (url) {
            try {
                // Attempt to fetch the webpage metadata as soon as the URL is entered
                const { data } = await getWebpageMetadata({ url });
                // Set the title from the fetched metadata, allowing the user to edit it if necessary
                setProposedTitle((data as any).title || '');
                setShowEditTitle(true); // Show the title input field for potential editing
            } catch (error) {
                // If there's an error fetching the metadata, log it and still allow the user to edit the title
                console.error('Error retrieving webpage metadata:', error);
                setProposedTitle(''); // Reset the proposed title
                setShowEditTitle(true); // Show the title input field for editing
            }
        } else {
            // If the URL is cleared, reset the title and hide the edit field
            setProposedTitle('');
            setShowEditTitle(false);
        }
    };


    const loadMoreArticles = (event: CustomEvent<void>) => {
        fetchAllArticles().then(() => {
            const infiniteScroll = event.target as HTMLIonInfiniteScrollElement;
            if (infiniteScroll) {
                infiniteScroll.complete();
            }
        }
        );
    }

    const showAlertForNewArticle = () => {
        setShowAlert(true);
        setNewArticleTitle(''); // Reset title for new alert
        setNewArticleContent(''); // Reset URL for new alert
    };

    const handleAlertInput = async (inputData: any) => {
        const url = inputData.url;
        if (url) {
            // Fetch the title as soon as the URL is inputted
            const fetchedTitle = await fetchAndSetArticleTitle(url);
            setNewArticleContent(url);
            setNewArticleTitle(fetchedTitle);
        }
    };

    const handleAlertSubmit = async (inputData: any) => {
        // Perform duplicate check and submission logic
        const url = inputData.url;
        if (url) {
            // Fetch the title and set it
            const fetchedTitle = await fetchAndSetArticleTitle(url);
            setNewArticleContent(url);
            setNewArticleTitle(fetchedTitle); // This will be the value from the fetch
            //
            const isDuplicate = await checkForDuplicateArticle(newArticleContent);
            if (isDuplicate) {
                alert('This link has already been submitted.');
                return;
            }

            // Submit the article
            const userNews = {
                title: newArticleTitle,
                content: newArticleContent,
                submittedBy: user?.username || 'Anonymous',
                timestamp: Timestamp.now(),
            };

            const userNewsCollection = collection(db, 'userNews');
            await addDoc(userNewsCollection, userNews);

            // Reset states and close the alert
            setNewArticleContent('');
            setNewArticleTitle('');
            setShowAlert(false);

            // Fetch updated list of articles
            fetchAllArticles();
        }
    }


    return (
        <IonPage className="ion-flex-offset-app">
            <IonHeader>
                <IonToolbar>
                    <IonTitle>News</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                {!user && (
                    <>
                        <IonRow className="sticky-row">
                            <IonCol>
                                <IonLabel>
                                    <h2 className="article-title">Please log in to submit articles</h2>
                                </IonLabel>
                            </IonCol>
                        </IonRow>
                        <IonRow className="sticky-row">
                            <IonCol>
                                <IonButton shape="round" routerLink="/login">
                                    Log in
                                </IonButton>
                            </IonCol>
                        </IonRow>
                    </>
                )}
                {user && (
                    <>
                        <IonRow className="sticky-row">
                            <IonCol>
                                <IonButton shape="round" onClick={showAlertForNewArticle}>
                                    Add Article
                                </IonButton>
                            </IonCol>
                        </IonRow>
                    </>
                )}
                <IonAlert
                    isOpen={showAlert}
                    onDidDismiss={() => setShowAlert(false)}
                    header={'Add News Article'}
                    message={!titleFetchSuccess ? "The title could not be automatically fetched. Please input the title manually for a successful BikeBus submission." : ""}
                    inputs={[
                        {
                            name: 'url',
                            type: 'url',
                            placeholder: 'Article URL',
                            value: newArticleContent,
                        },
                        {
                            name: 'title',
                            type: 'text',
                            placeholder: 'Article Title',
                            value: newArticleTitle,
                        }
                    ]}
                    buttons={[
                        {
                            text: 'Cancel',
                            role: 'cancel',
                            handler: () => setShowAlert(false)
                        },
                        {
                            text: 'Submit',
                            handler: (inputData) => {
                                if (!inputData.title && !titleFetchSuccess) {
                                    // If the title is empty and it was not fetched, do not close the alert
                                    setTitleFetchSuccess(false); // Keep showing the message that the title needs to be input manually
                                    return false; // Prevent the alert from being dismissed
                                }
                                submitUserNews(inputData); 
                            }
                        }
                    ]}
                />

                <IonList style={{ marginTop: showAlert ? '150px' : '0' }}>
                    {articles.map((article, index) => (
                        <IonItem
                            key={article.id || index}
                            button
                            onClick={() => {
                                if (article.content && typeof article.content === 'string') {
                                    openLink(article.content);
                                }
                            }}
                        >
                            <IonLabel>
                                <h2 className="article-title">{article.title}</h2>
                                <p>{article.content}</p>
                                <p>
                                    Posted: {new Date(article.timestamp.toMillis()).toLocaleString()} by {article.submittedBy}
                                </p>
                            </IonLabel>
                        </IonItem>
                    ))}
                </IonList>
                <IonInfiniteScroll
                    onIonInfinite={loadMoreArticles}
                    threshold="100px"
                    disabled={isInfiniteDisabled}
                >
                    <IonInfiniteScrollContent
                        loadingText="Loading more articles...">
                    </IonInfiniteScrollContent>
                </IonInfiniteScroll>
            </IonContent>
        </IonPage>
    );
};

export default News;

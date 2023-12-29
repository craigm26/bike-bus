import {
    IonContent,
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonModal,
} from '@ionic/react';
import { InputChangeEventDetail } from '@ionic/core';
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { db } from '../firebaseConfig';
import { collection, query, orderBy, startAfter, getDocs, addDoc, Timestamp, limit, DocumentData, QueryDocumentSnapshot, where } from 'firebase/firestore';
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
    const [showForm, setShowForm] = useState<boolean>(false);
    const [newArticleTitle, setNewArticleTitle] = useState<string>('');
    const [newArticleContent, setNewArticleContent] = useState<string>('');
    const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [isInfiniteDisabled, setIsInfiniteDisabled] = useState(false);
    const functions = getFunctions();
    const getWebpageMetadata = httpsCallable(functions, 'getWebpageMetadata');


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
        combinedArticles.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis()); // Sorting by timestamp

        setArticles(combinedArticles);
    };


    useEffect(() => {
        fetchAllArticles();
    }, []);

    const toggleForm = () => {
        setShowForm(prevShowForm => !prevShowForm);
    };


    const checkForDuplicateArticle = async (url: string) => {
        const newsQuery = query(collection(db, 'newsArticles'), where('content', '==', url));
        const userNewsQuery = query(collection(db, 'userNews'), where('content', '==', url));
        const [newsSnapshot, userNewsSnapshot] = await Promise.all([
            getDocs(newsQuery),
            getDocs(userNewsQuery),
        ]);
        return !newsSnapshot.empty || !userNewsSnapshot.empty;
    };

    const submitUserNews = async () => {
        if (!newArticleTitle?.trim() || !newArticleContent?.trim()) return;

        const isDuplicate = await checkForDuplicateArticle(newArticleContent);
        if (isDuplicate) {
            alert('This link has already been submitted.');
            return;
        }

        const userNews = {
            title: newArticleTitle,
            content: newArticleContent,
            author: user?.email || 'Anonymous',
            timestamp: Timestamp.now()
        };

        const userNewsCollection = collection(db, 'userNews');
        await addDoc(userNewsCollection, userNews);
    };

    const handleTitleChange = (event: CustomEvent<InputChangeEventDetail>) => {
        setNewArticleTitle(event.detail.value || '');
    };

    const handleContentChange = async (event: CustomEvent<InputChangeEventDetail>) => {
        const url = event.detail.value || '';
        setNewArticleContent(url);

        if (url) {
            // Call the backend function to retrieve metadata
            try {
                const { data } = await getWebpageMetadata({ url });
                setNewArticleTitle((data as any).title);
                // Handle image picker logic here using `data.imageUrls`
            } catch (error) {
                console.error('Error retrieving webpage metadata:', error);
            }
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

    return (
        <IonPage className="ion-flex-offset-app">
            <IonHeader>
                <IonToolbar>
                    <IonTitle>News</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonButton onClick={toggleForm}>
                    {showForm ? 'Hide Form' : 'Add News Article'}
                </IonButton>

                <IonModal isOpen={showForm} onDidDismiss={toggleForm}>
                    {user && (
                        <>
                            <IonItem>
                                <IonLabel position="stacked">Title</IonLabel>
                                <IonInput
                                    value={newArticleTitle}
                                    onIonChange={handleTitleChange}
                                />
                            </IonItem>
                            <IonItem>
                                <IonLabel position="stacked">Link</IonLabel>
                                <IonInput
                                    value={newArticleContent}
                                    onIonChange={handleContentChange}
                                />
                            </IonItem>
                            <div style={{ display: 'flex', justifyContent: 'space-evenly', padding: '10px' }}>

                                <IonButton
                                    expand="block"
                                    onClick={submitUserNews}
                                >
                                    Submit
                                </IonButton>
                                <IonButton
                                    color="medium"
                                    expand="block"
                                    onClick={toggleForm}
                                >
                                    Cancel
                                </IonButton>
                            </div>
                        </>
                    )}
                </IonModal>

                <IonList style={{ marginTop: showForm ? '150px' : '0' }}> {/* Adjust margin-top based on form visibility */}
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
                                <h2>{article.title}</h2>
                                <p>{article.content}</p>
                                {/* Display the timestamp */}
                                <p>
                                    Posted: {new Date(article.timestamp.toMillis()).toLocaleString()}
                                </p>
                            </IonLabel>
                        </IonItem>
                    ))}
                </IonList>
                {showForm && user && (
                    <>
                        <IonItem>
                            <IonLabel position="stacked">Title</IonLabel>
                            <IonInput
                                value={newArticleTitle}
                                onIonChange={handleTitleChange}
                            />
                        </IonItem>
                        <IonItem>
                            <IonLabel position="stacked">Link</IonLabel>
                            <IonInput
                                value={newArticleContent}
                                onIonChange={handleContentChange}
                            />
                        </IonItem>
                        <IonButton
                            expand="block"
                            onClick={submitUserNews}
                        >
                            Submit
                        </IonButton>
                    </>
                )}
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

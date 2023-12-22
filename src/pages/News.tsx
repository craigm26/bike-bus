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
} from '@ionic/react';
import { InputChangeEventDetail } from '@ionic/core';
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { db } from '../firebaseConfig';
import { collection, query, orderBy, startAfter, getDocs, addDoc, Timestamp, limit, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

const News: React.FC = () => {
    const { user } = useContext(AuthContext);
    const [articles, setArticles] = useState<DocumentData[]>([]);
    const [newArticleTitle, setNewArticleTitle] = useState<string>('');
    const [newArticleContent, setNewArticleContent] = useState<string>('');
    const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [isInfiniteDisabled, setIsInfiniteDisabled] = useState(false);

    const fetchArticles = async (lastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null) => {
        const newsCollection = collection(db, 'newsArticles');
        let articlesQuery;

        if (lastVisibleDoc) {
            articlesQuery = query(newsCollection, orderBy('timestamp', 'desc'), startAfter(lastVisibleDoc), limit(10));
        } else {
            articlesQuery = query(newsCollection, orderBy('timestamp', 'desc'), limit(10));
        }

        const snapshot = await getDocs(articlesQuery);
        const fetchedArticles = snapshot.docs.map(doc => doc.data());
        const lastDoc = snapshot.docs[snapshot.docs.length - 1];

        setArticles(prev => [...prev, ...fetchedArticles]);
        setLastVisible(lastDoc);

        if (snapshot.docs.length < 10) {
            setIsInfiniteDisabled(true);
        }
    };

    useEffect(() => {
        fetchArticles(null);
    }, []);

    const submitUserNews = async () => {
        if (!newArticleTitle?.trim() || !newArticleContent?.trim()) return;

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

    const handleContentChange = (event: CustomEvent<InputChangeEventDetail>) => {
        setNewArticleContent(event.detail.value || '');
    };

    const loadMoreArticles = (event: CustomEvent<void>) => {
        fetchArticles(lastVisible).then(() => {
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
                <IonList>
                    {articles.map((article, index) => (
                        <IonItem key={index}>
                            <IonLabel>
                                <h2>{article.title}</h2>
                                <p>{article.contentSnippet || article.content}</p>
                            </IonLabel>
                        </IonItem>
                    ))}
                </IonList>
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
                            <IonLabel position="stacked">Content</IonLabel>
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

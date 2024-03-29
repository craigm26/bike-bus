import { useState } from 'react';
import { Route, Redirect, Switch } from 'react-router-dom';
import { IonApp, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonPage, IonMenuToggle, IonLabel, IonRouterOutlet, setupIonicReact, IonButton, IonText, IonFabButton, IonFab, IonButtons, IonChip, IonMenuButton, IonPopover, IonAvatar, IonActionSheet, IonSpinner, IonIcon } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { getDoc } from 'firebase/firestore';
import { HeaderContext } from './components/HeaderContext';
import { MapProvider } from './components/Mapping/MapContext';
import { Share } from '@capacitor/share';
import { useTranslation } from 'react-i18next';


import Map from './pages/Map';
import Login from './pages/Login';
import Profile from './components/Profile';
import Logout from './components/Logout';
import SignUp from './pages/SignUp';
import Help from './pages/Help';
import About from './pages/About';
import Account from './pages/Account';
import Welcome from './pages/Welcome';
import BikeBusGroupPage from './pages/BikeBusGroupPage';
import Settings from './pages/Settings';
import ViewRoute from './pages/ViewRoute';
import SetUserDetails from './components/SetUserDetails';
import CreateOrganization from './pages/CreateOrganization';
import CreateBikeBusGroup from './pages/CreateBikeBusGroup';
import CreateBikeBusStops from './pages/CreateBikeBusStops';
import { RouteProvider } from './components/RouteContext';
import CreateRoute from './pages/createRoute';
import React from 'react';
import { logoGithub, shareOutline } from 'ionicons/icons';
import Avatar from './components/Avatar';
import ViewSchedule from './pages/ViewSchedule';
import AddSchedule from './pages/AddSchedule';
import UpdateRouteManually from './pages/UpdateRouteManually';
import Event from './pages/Event';
import ViewRouteList from './pages/ViewRouteList';
import EditRoute from './pages/EditRoute';
import ViewBikeBusList from './pages/ViewBikeBusList';
import EditBikeBus from './pages/EditBikeBus';
import EditSchedule from './pages/EditSchedule';
import EventSummary from './pages/EventSummary';
import ViewOrganization from './pages/ViewOrganization';
import ViewOrganizationList from './pages/ViewOrganizationList';
import BulletinBoards from './pages/BulletinBoards';
import PrivacyPolicy from './pages/PrivacyPolicy';
import DeleteAccount from './components/DeleteAccount';
import SetLanguage from './components/SetLanguage';
import News from './pages/News';
import ManageRoutes from './components/BikeBusGroup/ManageRoutes';
import Directory from './pages/Directory';


import { ReactComponent as ClipboardIcon } from './assets/fontawesome/svgs/regular/clipboard-list.svg';
import { ReactComponent as ShareIcon } from './assets/fontawesome/svgs/regular/arrow-up-from-bracket.svg';
import { ReactComponent as HelpIcon } from './assets/fontawesome/svgs/regular/square-question.svg';
import { ReactComponent as UserIcon } from './assets/fontawesome/svgs/regular/user.svg';
import { ReactComponent as Language } from './assets/fontawesome/svgs/regular/language.svg';
import { ReactComponent as MapIcon } from './assets/fontawesome/svgs/regular/map.svg';


import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

import './theme/variables.css';
import { CurrentLocationProvider } from './components/CurrentLocationContext';
import EditOrganization from './pages/EditOrganization';
import { AuthContext } from './AuthContext';
import { useContext } from 'react';

setupIonicReact();

const App: React.FC = () => {
  const { user, loadingAuthState } = useContext(AuthContext);
  const [showPopover, setShowPopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<any>(null);
  const [showHeader, setShowHeader] = useState(true);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const { t } = useTranslation();

  const label = user?.username ? user.username : "anonymous";
  const togglePopover = (e: any) => {
    setPopoverEvent(e.nativeEvent);
    setShowPopover((prevState) => !prevState);
  };

  const avatarElement = () => {
    return user ? (
      <IonAvatar>
        <Avatar uid={user.uid} size="extrasmall" />
      </IonAvatar>
    ) : (
      <UserIcon style={{ width: '24px', height: '24px' }} />
    )
  };

  if (loadingAuthState) {
    return <IonSpinner />;
  }

  return (
    <IonApp>
      <HeaderContext.Provider value={{ showHeader, setShowHeader }}>
        <IonReactRouter>
          <RouteProvider>
            <React.Fragment>
              <IonMenu side="start" content-id="main-content">
                <IonHeader>
                  <IonToolbar>
                    <IonTitle class="BikeBusFont">{t('Menu')}</IonTitle>
                  </IonToolbar>
                </IonHeader>
                <IonContent>
                  <IonList>
                    <IonMenuToggle auto-hide="false">
                      <IonItem button routerLink="/Welcome" routerDirection="none">
                        <IonLabel>{t('Welcome')}</IonLabel>
                      </IonItem>
                      <IonItem button routerLink="/News" routerDirection="none">
                        <IonLabel>{t('News')}</IonLabel>
                      </IonItem>
                      <IonItem button routerLink='/ViewSchedule/OZrruuBJptp9wkAAVUt7' routerDirection="none">
                        <IonLabel>{t('Events')}</IonLabel>
                      </IonItem>
                      <IonItem button routerLink="/Directory" routerDirection="none">
                        <IonLabel>{t('Directory')}</IonLabel>
                      </IonItem>
                      <IonItem button routerLink="/BulletinBoards" routerDirection="none">
                        <IonLabel>{t('Bulletin Boards')}</IonLabel>
                      </IonItem>
                      <IonItem button routerLink="/Map" routerDirection="none">
                        <IonLabel>{t('Map')}</IonLabel>
                      </IonItem>
                      <IonItem button routerLink='/ViewRouteList' routerDirection="none">
                        <IonLabel>{t('Routes')}</IonLabel>
                      </IonItem>
                      <IonItem button routerLink='/ViewBikeBusList' routerDirection="none">
                        <IonLabel>{t('BikeBusses')}</IonLabel>
                      </IonItem>
                      <IonItem button routerLink='/ViewOrganizationList' routerDirection="none">
                        <IonLabel>{t('Organizations')}</IonLabel>
                      </IonItem>
                      <IonItem button routerLink="/Help" routerDirection="none">
                        <IonLabel>{t('Help')}</IonLabel>
                      </IonItem>
                      <IonItem button routerLink="/about" routerDirection="none">
                        <IonLabel>{t('About')}</IonLabel>
                      </IonItem>
                      <IonItem button routerLink="/PrivacyPolicy" routerDirection="none">
                        <IonLabel>{t('Privacy Policy')}</IonLabel>
                      </IonItem>
                    </IonMenuToggle>
                  </IonList>
                </IonContent>
              </IonMenu>
              <IonPage id="main-content" >
                <IonContent fullscreen>
                  <div className="ion-flex-offset-app-header">
                    <IonHeader>
                      <IonToolbar color="primary" >
                        <IonButtons color="secondary" slot="start">
                          <IonMenuButton></IonMenuButton>
                        </IonButtons>
                        <IonText slot="start" color="secondary" class="BikeBusFont">
                          <h1>BikeBus</h1>
                        </IonText>
                        <IonButton fill="clear" slot="end" onClick={togglePopover}>
                          <IonChip>
                            {avatarElement()}
                            <IonLabel>{label}</IonLabel>
                          </IonChip>
                        </IonButton>
                        <IonPopover
                          isOpen={showPopover}
                          event={popoverEvent}
                          onDidDismiss={() => setShowPopover(false)}
                          className="my-popover"
                        >
                          <Profile onClose={() => setShowPopover(false)} />
                        </IonPopover>

                        <IonButtons slot="primary">
                          <IonActionSheet
                            isOpen={showActionSheet}
                            onDidDismiss={() => setShowActionSheet(false)}
                            buttons={[
                              {
                                text: 'Share',
                                icon: shareOutline,
                                handler: () => {
                                  Share.share({
                                    title: 'Check out my BikeBus link!',
                                    text: 'I found this link on the BikeBus app',
                                    url: window.location.href,
                                  });
                                }
                              },
                              {
                                text: 'Cancel',
                                role: 'cancel',
                                handler: () => {
                                  console.log('Cancel clicked');
                                }
                              },
                            ]}
                          />
                          <IonButton onClick={() => window.open('https://github.com/craigm26/bike-bus/discussions/new?category=q-a', '_blank')}>
                            <IonIcon icon={logoGithub} />
                          </IonButton>
                          <IonButton onClick={() => setShowActionSheet(true)}>
                            <ShareIcon style={{ width: '18px', height: '18px' }} />
                          </IonButton>
                          <IonButton routerLink='/help'>
                            <HelpIcon style={{ width: '18px', height: '18px' }} />
                          </IonButton>
                          <IonButton routerLink='/SetLanguage'>
                            <Language style={{ width: '18px', height: '18px' }} />
                          </IonButton>
                        </IonButtons>
                      </IonToolbar>
                    </IonHeader>
                  </div>
                  <IonRouterOutlet>
                    <React.Fragment>
                      <Route exact path="/Welcome">
                        <Welcome />
                      </Route>
                      <Route exact path="/PrivacyPolicy">
                        <PrivacyPolicy />
                      </Route>
                      <Route exact path="/BulletinBoards">
                        <CurrentLocationProvider>
                          <BulletinBoards />
                        </CurrentLocationProvider>
                      </Route>
                      <Route exact path="/BulletinBoards/:bborOrgId">
                        <CurrentLocationProvider>
                          <BulletinBoards />
                        </CurrentLocationProvider>
                      </Route>
                      <Route exact path="/CreateOrganization">
                        <CreateOrganization />
                      </Route>
                      <Route exact path="/ViewOrganization/:id">
                        <ViewOrganization />
                      </Route>
                      <Route exact path="/EditOrganization/:id">
                        <EditOrganization />
                      </Route>
                      <Route exact path="/ViewOrganizationList">
                        <ViewOrganizationList />
                      </Route>
                      <Route path="/viewroute/:id" exact>
                        <ViewRoute />
                      </Route>
                      <Route path="/EditRoute/:id" exact>
                        <EditRoute />
                      </Route>
                      <Route path="/updateroutemanually/:id" exact>
                        <UpdateRouteManually />
                      </Route>
                      <Route exact path="/viewroutelist">
                        <ViewRouteList />
                      </Route>
                      <Route exact path="/Directory">
                        <Directory />
                      </Route>
                      <Route exact path="/viewschedule/:id">
                        <ViewSchedule />
                      </Route>
                      <Route exact path="/addschedule/:id">
                        <AddSchedule />
                      </Route>
                      <Route exact path="/editschedule/:id">
                        <EditSchedule />
                      </Route>
                      <Route exact path="/viewbikebuslist">
                        <ViewBikeBusList />
                      </Route>
                      <Route path="/editbikebus/:id" exact>
                        <EditBikeBus />
                      </Route>
                      <Route path="/event/:id">
                        <Event />
                      </Route>
                      <Route exact path="/Profile">
                        <Profile onClose={function (): void {
                          throw new Error('Function not implemented.');
                        }} />
                      </Route>
                      <Route exact path="/Account">
                        <Account />
                      </Route>
                      <Route exact path="/News">
                        <News />
                      </Route>
                      <Route exact path="/SetUserDetails">
                        <SetUserDetails />
                      </Route>
                      <Route exact path="/Map">
                        <MapProvider
                        >
                          <Map />
                        </MapProvider>
                      </Route>
                      <Route exact path="/ViewBikeBusGroup">
                        <BikeBusGroupPage />
                      </Route>
                      <Route exact path="/ManageRoutes/:id">
                        <ManageRoutes />
                      </Route>
                      <Route exact path="/ViewRoute">
                        <ViewRoute />
                      </Route>
                      <Route exact path="/CreateRoute">
                        <CreateRoute />
                      </Route>
                      <Route path="/CreateBikeBusGroup/:RouteID" component={CreateBikeBusGroup} />
                      <Route path="/CreateBikeBusStops/:id">
                        <CreateBikeBusStops />
                      </Route>
                      <Route exact path="/Login">
                        <Login />
                      </Route>
                      <Route exact path="/SignUp">
                        <SignUp />
                      </Route>
                      <Route exact path="/Logout">
                        <Logout />
                      </Route>
                      <Route exact path="/help">
                        <Help />
                      </Route>
                      <Route exact path="/about">
                        <About />
                      </Route>
                      <Route exact path="/SetLanguage">
                        <SetLanguage />
                      </Route>
                      <Route exact path="/DeleteAccount">
                        <DeleteAccount />
                      </Route>
                      <Route exact path="/EventSummary/:id">
                        <EventSummary />
                      </Route>
                      <Route exact path="/settings">
                        <Settings />
                      </Route>
                      <Switch>
                        <Route exact path="/Map/:id?" component={Map} />
                        <Route exact path="/">
                          <Redirect to="/Welcome/" />
                        </Route>
                      </Switch>
                      <Switch>
                        <Route exact path="/bikebusgrouppage/:groupId">
                          <BikeBusGroupPage />
                        </Route>
                      </Switch>
                    </React.Fragment>
                  </IonRouterOutlet>
                </IonContent>
              </IonPage>
              {user && (
                <div className='bikebus-footer'>
                  <div className='map-button-container footer-content'>
                    <IonFab vertical="bottom" horizontal="start" slot="fixed">
                      <IonFabButton routerLink="/Map" routerDirection="none">
                        <MapIcon style={{ width: '24px', height: '24px' }} />
                      </IonFabButton>
                    </IonFab>
                  </div>

                  <div className='map-button-container footer-content'>
                    <IonFab vertical="bottom" horizontal="end" slot="fixed">
                      <IonFabButton routerLink="/BulletinBoards/" routerDirection="none">
                        <ClipboardIcon style={{ width: '24px', height: '24px' }} />
                      </IonFabButton>
                    </IonFab>
                  </div>
                </div>
              )}
            </React.Fragment>

          </RouteProvider>

        </IonReactRouter>
      </HeaderContext.Provider>
    </IonApp >
  );
};

export default App;

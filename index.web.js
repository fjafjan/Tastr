import { AppRegistry } from 'react-native';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { name as appName } from './app.json';
import { registerRootComponent } from 'expo';

// register the app
AppRegistry.registerComponent(appName, () => App);
registerRootComponent(App)
AppRegistry.runApplication(appName, {
  initialProps: {},
  rootTag: document.getElementById('root'),
});

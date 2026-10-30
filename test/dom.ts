import { GlobalRegistrator } from '@happy-dom/global-registrator'

// One DOM for the whole run: the testing library caches `document`, so a file that unregistered its own would leave
// every later test on a closed window.
GlobalRegistrator.register({ url: 'http://localhost/' })
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

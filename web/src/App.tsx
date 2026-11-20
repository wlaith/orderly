import { go, toLogin, useRoute } from './lib/router'
import { StoreProvider, useStore } from './lib/store'
import { Dashboard } from './screens/Dashboard'
import { HostPage } from './screens/HostPage'
import { MakeLink } from './screens/MakeLink'
import { TicketScreen } from './screens/TicketScreen'
import { Welcome } from './screens/Welcome'
import { THEME } from './theme'

export default function App() {
  return (
    <StoreProvider>
      {/* The theme also lives on the app's own wrapper, so every screen keeps it whatever happens to <html>. */}
      <div data-doorin-theme={THEME} className="contents">
        <Screens />
      </div>
    </StoreProvider>
  )
}

function Screens() {
  const route = useRoute()
  const { dispatch, signedIn, pendingName, host, ready, missing, lastTake, reloadMe } = useStore()

  const signOut = () => {
    dispatch({ type: 'signOut' })
    go('welcome')
  }

  let screen
  switch (route) {
    case 'welcome':
      screen = <Welcome onSignedIn={() => (signedIn ? go('dashboard') : toLogin())} />
      break
    case 'make-link':
      screen = ready && pendingName !== null && (
        <MakeLink
          host={{ name: pendingName, email: '' }}
          initialTopic=""
          onSignOut={signOut}
          onCreated={async () => {
            await reloadMe()
            go('dashboard')
          }}
        />
      )
      if (ready && signedIn) go('dashboard')
      break
    case 'dashboard':
      screen = host && signedIn && <Dashboard justCreated={false} onViewPage={() => go('host-page')} onSignOut={signOut} />
      break
    case 'host-page':
      screen = missing ? <NotFound /> : host && (
        <HostPage
          onTaken={() => { void lastTake()?.then((token) => token && go('ticket')) }}
          onSeeTicket={() => go('ticket')}
        />
      )
      break
    case 'ticket':
      screen = missing ? <NotFound /> : host && <TicketScreen onBackToPage={() => go('host-page')} />
      break
  }

  return <div key={route} className="page-in">{screen}</div>
}

function NotFound() {
  return (
    <div className="container-app py-24 text-center">
      <h1 className="text-poster">Nothing here</h1>
      <p className="mt-3 text-[17px] text-secondary">This link doesn't lead to a line. Check the address, or ask for a fresh link.</p>
      <button type="button" className="btn btn-ghost mt-6 min-h-touch px-3 underline" onClick={() => go('welcome')}>Go to Orderly</button>
    </div>
  )
}

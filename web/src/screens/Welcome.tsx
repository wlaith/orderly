import { Landing } from './Landing'

export function Welcome({ onSignedIn }: { onSignedIn: () => void }) {
  return <Landing onSignedIn={onSignedIn} />
}

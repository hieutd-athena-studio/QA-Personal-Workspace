import { createFileRoute, useParams } from '@tanstack/react-router'
import { ExecutionPage } from '@renderer/components/execution/ExecutionPage'

export const Route = createFileRoute('/cycles/$cycleId/execute')({
  component: ExecuteRoute
})

function ExecuteRoute(): React.JSX.Element {
  const { cycleId } = useParams({ from: '/cycles/$cycleId/execute' })
  return <ExecutionPage cycleId={cycleId} />
}

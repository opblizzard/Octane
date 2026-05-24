import { RouterProvider } from 'react-router-dom'
import { router } from '@router/index'
import { Toast } from '@components/primitives/Toast'

export default function App() {
  return (
    <>
      <div className="scan-line" />
      <RouterProvider router={router} />
      <Toast />
    </>
  )
}

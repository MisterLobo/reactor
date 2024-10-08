import RootLayout from './app/layout'
import { Outlet } from 'react-router-dom';
import { Button } from '@mui/material';
import { SnackbarProvider, useSnackbar } from 'notistack';

function App() {
  const { closeSnackbar } = useSnackbar();
  return (
    <SnackbarProvider
      autoHideDuration={5000}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      maxSnack={3}
      preventDuplicate
      action={(snackId) => (
        <Button onClick={() => closeSnackbar(snackId)}>
          Dismiss
        </Button>
      )}
    >
      <RootLayout>
        <Outlet />
      </RootLayout>
    </SnackbarProvider>
  )
}

export default App

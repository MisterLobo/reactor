import Toolbar from '@mui/material/Toolbar';
import AppBar from '@mui/material/AppBar';
import Typography from '@mui/material/Typography';
import { Search, SearchIconWrapper, StyledInputBase, VisibilityToggle } from '../components/client';
import SearchIcon from '@mui/icons-material/Search';
import ConnectionCard from '../components/connection-card';

export default function ConnectionsPage() {
  const connections: any = [];

  return (
    <div className="h-full">
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${240}px)` },
          ml: { sm: `${240}px` },
        }}
      >
        <Toolbar>
          {/* <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="open drawer"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton> */}
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}
          >
            Connections
          </Typography>
          <VisibilityToggle />
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase placeholder="Search..." inputProps={{ 'aria-label': 'search' }} />
          </Search>
        </Toolbar>
      </AppBar>
      {connections.map((c: any) => (
        <ConnectionCard key={c.name} name={c.name} />
      ))}
    </div>
  );
}
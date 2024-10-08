import { TabContext, TabList, TabPanel } from '@mui/lab';
import { AppBar, Box, Card, CardActions, CardContent, Grid2 as Grid, Tab, Toolbar, Typography } from '@mui/material';
import { SyntheticEvent, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, SearchIconWrapper, StyledInputBase } from '../components/client';
import SearchIcon from '@mui/icons-material/Search';

export default function ContainerDetails({ name: pName, id }: { name?: string, id?: string }) {
  const location = useLocation();
  const [value, setValue] = useState<string>('1');

  const { name } = useMemo(() => {
    if (pName) {
      return {
        name: pName,
      };
    }
    const search = new URLSearchParams(location.search)
    const name = search.get('name');
    return {
      name,
    };
  }, [pName])

  useEffect(() => {
    const search = new URLSearchParams(location.search)
    console.log('[search]:', search.get('name'));
  }, [location]);

  useEffect(() => {
    console.log('test');
    
    console.log('[location]:', location.hash);
  }, [location]);

  const onTabChange = (_event: SyntheticEvent, newvalue: string) => {
    setValue(newvalue);
  }

  return (
    <>
    <AppBar
      position="fixed"
      sx={{
        width: { sm: `calc(100% - ${240}px)` },
        ml: { sm: `${240}px` },
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}
        >
          Container Details
        </Typography>
        <Search>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <StyledInputBase placeholder="Search..." inputProps={{ 'aria-label': 'search' }} />
        </Search>
      </Toolbar>
    </AppBar>
    <Grid container spacing={2}>
      <Grid size={4}>
        <Card className="w-100 h-96">
          <CardContent>
            <Box component="div" className="space-y-2">
              <Typography variant="h2" className="text-2xl">{ name }</Typography>
              <Typography variant="body2">{ id }</Typography>
            </Box>
          </CardContent>
          <CardActions></CardActions>
        </Card>
      </Grid>
      <Grid size={4}>
        <Card className="w-100 h-96">
          <CardContent>
          </CardContent>
          <CardActions></CardActions>
        </Card>
      </Grid>
      <Grid size={4}>
        <Card className="w-100 h-96">
          <CardContent>
          </CardContent>
          <CardActions></CardActions>
        </Card>
      </Grid>
      <Grid size={12}>
        <Card sx={{ flex: 1, width: '100%', height: '100vh' }}>
          <CardContent>
            <TabContext value={value}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <TabList onChange={onTabChange}>
                  <Tab label="INFO" value="1" />
                  <Tab label="LOGS" value="2" />
                  <Tab label="STATS" value="3" />
                  <Tab label="TERMINAL" value="4" />
                </TabList>
              </Box>
              <TabPanel value="1">Info</TabPanel>
              <TabPanel value="2">Logs</TabPanel>
              <TabPanel value="3">Stats</TabPanel>
              <TabPanel value="4">Terminal</TabPanel>
            </TabContext>
          </CardContent>
          <CardActions></CardActions>
        </Card>
      </Grid>
    </Grid>
    </>
  );
}

import { alpha, styled } from '@mui/material/styles';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import { useState } from 'react';
import { Construction, DeleteSweep, FileDownload, Lan, RocketLaunch, Settings, Visibility, VisibilityOff } from '@mui/icons-material';
import SpeedDial from '@mui/material/SpeedDial';
import Box from '@mui/material/Box';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import RunContainerDialog from './modals/run-container';
import PullImageDialog from './modals/pull-image';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import MuiAccordionSummary, {
  AccordionSummaryProps,
} from '@mui/material/AccordionSummary';
import BuildImageDialog from './modals/build-image';
import SettingsDialog from './modals/settings';
import ManageConnectionsDialog from './modals/connections';
import PruneDialog from './modals/prune';

interface ExpandMoreProps extends IconButtonProps {
  expand: boolean;
}

export const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(1),
    width: 'auto',
  },
}));

export const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

export const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    [theme.breakpoints.up('sm')]: {
      width: '12ch',
      '&:focus': {
        width: '20ch',
      },
    },
  },
}));

export const VisibilityToggle = () => {
  const [visible, setVisible] = useState(false);

  return (
    <IconButton onClick={() => setVisible(!visible)}>
      {visible ? <VisibilityOff /> : <Visibility />}
    </IconButton>
  )
}

export const StyledSpeedDial = styled(SpeedDial)(({ theme }) => ({
  position: 'absolute',
  '&.MuiSpeedDial-directionUp, &.MuiSpeedDial-directionLeft': {
    bottom: theme.spacing(2),
    right: theme.spacing(2),
  },
  '&.MuiSpeedDial-directionDown, &.MuiSpeedDial-directionRight': {
    top: theme.spacing(2),
    left: theme.spacing(2),
  },
}));

export const SpeedDialSection = () => {
  const [showRunModal, setShowRunModal] = useState(false);
  const [showPullModal, setShowPullModal] = useState(false);
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showConnectionsModal, setShowConnectionsModal] = useState(false);
  const [showPruneModal, setShowPruneModal] = useState(false);
  const actions = [
    { icon: <Settings />, name: 'Settings', action: () => {
      setShowSettingsModal(true);
    } },
    { icon: <Lan />, name: 'Connections', action: () => {
      setShowConnectionsModal(true);
    } },
    { icon: <DeleteSweep />, name: 'Prune', action: () => {
      setShowPruneModal(true);
    } },
    { icon: <Construction />, name: 'Build', action: () => {
      setShowBuildModal(true);
    } },
    { icon: <FileDownload />, name: 'Pull', action: () => {
      setShowPullModal(true);
    } },
    { icon: <RocketLaunch />, name: 'Run', action: () => {
      setShowRunModal(true);
    } },
  ];
  return (
    <>
    <Box sx={{ transform: 'translateZ(100px)', flexGrow: 0, position: 'relative', bottom: 16, right: 16 }}>
      <StyledSpeedDial
        ariaLabel="create"
        icon={<SpeedDialIcon />}
      >
        {actions.map(a => (
          <SpeedDialAction
            key={a.name}
            icon={a.icon}
            tooltipTitle={a.name}
            onClick={a.action}
          />
        ))}
      </StyledSpeedDial>
    </Box>
    {showRunModal && <RunContainerDialog visible={showRunModal} onClose={() => setShowRunModal(false)} />}
    {showPullModal && <PullImageDialog visible={showPullModal} onClose={() => setShowPullModal(false)} />}
    {showBuildModal && <BuildImageDialog visible={showBuildModal} onClose={() => setShowBuildModal(false)} />}
    {showPruneModal && <PruneDialog visible={showPruneModal} onClose={() => setShowPruneModal(false)} />}
    <SettingsDialog visible={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
    <ManageConnectionsDialog visible={showConnectionsModal} onClose={(() => setShowConnectionsModal(false))} />
    </>
  );
}

export const ExpandMore = styled((props: ExpandMoreProps) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

export const Accordion = styled((props: AccordionProps) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  '&:not(:last-child)': {
    borderBottom: 0,
  },
  '&::before': {
    display: 'none',
  },
}));

export const AccordionSummary = styled((props: AccordionSummaryProps) => (
  <MuiAccordionSummary
    expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem' }} />}
    {...props}
  />
))(({ theme }) => ({
  backgroundColor: 'rgba(0, 0, 0, .03)',
  flexDirection: 'row-reverse',
  '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
    transform: 'rotate(90deg)',
  },
  '& .MuiAccordionSummary-content': {
    marginLeft: theme.spacing(1),
  },
  ...theme.applyStyles('dark', {
    backgroundColor: 'rgba(255, 255, 255, .05)',
  }),
}));

export const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: '1px solid rgba(0, 0, 0, .125)',
}));

export const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});
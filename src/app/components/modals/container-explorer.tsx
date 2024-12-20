
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { forwardRef, Ref, useEffect, useState } from 'react';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import { TreeViewBaseItem } from '@mui/x-tree-view/models';
import { TreeItem2Provider } from '@mui/x-tree-view/TreeItem2Provider';
import { alpha, Box, Breadcrumbs, Card, CardContent, Grid2 as Grid, Link, styled, Toolbar, Typography } from '@mui/material';
import { invoke } from '@tauri-apps/api/core';
import { ContainerLsParams } from '@/bindings/ContainerLsParams';
import { ContainerLsResponse } from '@/bindings/ContainerLsResponse';
import { ContainerFileInfo } from '@/bindings/ContainerFileInfo';
import { useTreeItem2 } from '@mui/x-tree-view/useTreeItem2';
import { TreeItem2Checkbox, TreeItem2Content, TreeItem2IconContainer, TreeItem2Label, TreeItem2Root } from '@mui/x-tree-view/TreeItem2';
import { treeItemClasses } from '@mui/x-tree-view/TreeItem';
import { TreeItem2Icon } from '@mui/x-tree-view/TreeItem2Icon';
import Collapse from '@mui/material/Collapse';
import ArticleIcon from '@mui/icons-material/Article';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import FolderRounded from '@mui/icons-material/FolderRounded';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import VideoCameraBackIcon from '@mui/icons-material/VideoCameraBack';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import clsx from 'clsx';
import { TreeItem2DragAndDropOverlay } from '@mui/x-tree-view/TreeItem2DragAndDropOverlay';
import { animated, useSpring } from '@react-spring/web';
import { useTreeViewApiRef } from '@mui/x-tree-view/hooks/useTreeViewApiRef';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import Alert from '@mui/material/Alert';
import { intlFormatDistance, parseJSON } from 'date-fns';
import { TermExecParams } from '@/bindings/TermExecParams';
import { ContainerHostInfoQueryParams } from '@/bindings/ContainerHostInfoQueryParams';
import { ContainerHostInfo } from '@/bindings/ContainerHostInfo';

type ContainerExplorerProps = {
  cid: string,
  visible: boolean,
  onClose: () => void,
}

type FileType = 'image' | 'pdf' | 'doc' | 'video' | 'folder' | 'pinned' | 'trash';
type BreadCrumItem = { id: string, label: string, value?: string, [key:string]: any };

type ExtendedTreeItemProps = ContainerFileInfo & {
  expanded?: boolean,
  expandable?: boolean,
  [key:string]: any,
}

const StyledTreeItemRoot = styled(TreeItem2Root)(({ theme }) => ({
  color: theme.palette.grey[400],
  position: 'relative',
  [`& .${treeItemClasses.groupTransition}`]: {
    marginLeft: theme.spacing(3.5),
  },
  ...theme.applyStyles('light', {
    color: theme.palette.grey[800],
  }),
})) as unknown as typeof TreeItem2Root;

const CustomTreeItemContent = styled(TreeItem2Content)(({ theme }) => ({
  flexDirection: 'row-reverse',
  borderRadius: theme.spacing(0.7),
  marginBottom: theme.spacing(0.5),
  marginTop: theme.spacing(0.5),
  padding: theme.spacing(0.5),
  paddingRight: theme.spacing(1),
  fontWeight: 500,
  [`&.Mui-expanded `]: {
    '&:not(.Mui-focused, .Mui-selected, .Mui-selected.Mui-focused) .labelIcon': {
      color: theme.palette.primary.dark,
      ...theme.applyStyles('light', {
        color: theme.palette.primary.main,
      }),
    },
    '&::before': {
      content: '""',
      display: 'block',
      position: 'absolute',
      left: '16px',
      top: '44px',
      height: 'calc(100% - 48px)',
      width: '1.5px',
      backgroundColor: theme.palette.grey[700],
      ...theme.applyStyles('light', {
        backgroundColor: theme.palette.grey[300],
      }),
    },
  },
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    color: 'white',
    ...theme.applyStyles('light', {
      color: theme.palette.primary.main,
    }),
  },
  [`&.Mui-focused, &.Mui-selected, &.Mui-selected.Mui-focused`]: {
    backgroundColor: theme.palette.primary.dark,
    color: theme.palette.primary.contrastText,
    ...theme.applyStyles('light', {
      backgroundColor: theme.palette.primary.main,
    }),
  },
}));

const isExpandable = (reactChildren: React.ReactNode) => {
  if (Array.isArray(reactChildren)) {
    return reactChildren.length > 0 && reactChildren.some(isExpandable);
  }
  return Boolean(reactChildren);
};

const getIconFromFileType = (fileType: FileType) => {
  switch (fileType) {
    case 'image':
      return ImageIcon;
    case 'pdf':
      return PictureAsPdfIcon;
    case 'doc':
      return ArticleIcon;
    case 'video':
      return VideoCameraBackIcon;
    case 'folder':
      return FolderRounded;
    case 'pinned':
      return FolderOpenIcon;
    case 'trash':
      return DeleteIcon;
    default:
      return ArticleIcon;
  }
};

const AnimatedCollapse = animated(Collapse);

function TransitionComponent(props: any) {
  const style = useSpring({
    to: {
      opacity: props.in ? 1 : 0,
      transform: `translate3d(0,${props.in ? 0 : 20}px,0)`,
    },
  });

  return <AnimatedCollapse style={style} {...props} />;
}

const StyledTreeItemLabelText = styled(Typography)({
  color: 'inherit',
  fontFamily: 'General Sans',
  fontWeight: 500,
}) as unknown as typeof Typography;

function DotIcon() {
  return (
    <Box
      sx={{
        width: 6,
        height: 6,
        borderRadius: '70%',
        bgcolor: 'warning.main',
        display: 'inline-block',
        verticalAlign: 'middle',
        zIndex: 1,
        mx: 1,
      }}
    />
  );
}

function CustomLabel({
  icon: Icon,
  expandable,
  children,
  ...other
}: any) {
  return (
    <TreeItem2Label
      {...other}
      sx={{
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {Icon && (
        <Box
          component={Icon}
          className="labelIcon"
          color="inherit"
          sx={{ mr: 1, fontSize: '1.2rem' }}
        />
      )}

      <StyledTreeItemLabelText variant="body2">{children}</StyledTreeItemLabelText>
      {expandable && <DotIcon />}
    </TreeItem2Label>
  );
}
const CustomTreeItem = forwardRef(function CustomTreeItem(props: any, ref: Ref<HTMLLIElement>) {
  const { id, itemId, label, disabled, children, ...other } = props;
  const {
    getRootProps,
    getContentProps,
    getIconContainerProps,
    getCheckboxProps,
    getLabelProps,
    getGroupTransitionProps,
    getDragAndDropOverlayProps,
    status,
    publicAPI,
  } = useTreeItem2({ id, itemId, children, label, disabled, rootRef: ref });
  const item = publicAPI.getItem(itemId);
  // console.log('[TreeItem]:', itemId, id, label);
  
  const expandable = isExpandable(children);
  let icon = FolderRounded;
  if (expandable || item.is_dir) {
    icon = FolderRounded;
  } else if (item.file_type) {
    icon = getIconFromFileType(item.file_type);
  }

  return (
    <TreeItem2Provider itemId={itemId}>
      <StyledTreeItemRoot {...getRootProps(other)} onClick={console.log}>
        <CustomTreeItemContent
          {...getContentProps({
            className: clsx('content', {
              'Mui-expanded': status.expanded,
              'Mui-selected': status.selected,
              'Mui-focused': status.focused,
              'Mui-disabled': status.disabled,
            }),
          })}
        >
          <TreeItem2IconContainer {...getIconContainerProps()}>
            <TreeItem2Icon status={status} />
          </TreeItem2IconContainer>
          <TreeItem2Checkbox {...getCheckboxProps()} />
          <CustomLabel
            {...getLabelProps({ icon, expandable: expandable && status.expanded })}
          />
          <TreeItem2DragAndDropOverlay {...getDragAndDropOverlayProps()} />
        </CustomTreeItemContent>
        {children && <TransitionComponent {...getGroupTransitionProps()} />}
      </StyledTreeItemRoot>
    </TreeItem2Provider>
  )
})

export default function ContainerExplorerDialog({ cid, visible, onClose }: ContainerExplorerProps) {
  const [_open, setOpen] = useState(visible);
  const treeRef = useTreeViewApiRef();
  const generate = async (count = 1, depth = 1, level = 1): Promise<TreeViewBaseItem[]> => {
    if (depth - level < 0) {
      return [];
    }
    const items: TreeViewBaseItem[] = [];
    for (const i in Array(count).fill('folder')) {
      const children = await generate(count, depth, level+1);
      const id = `${crypto.randomUUID()}:${level}:${depth}`;
      items.push({
        id,
        label: `Item ${level}-${i+1}`,
        children,
      });
    }

    return items;
  };
  const [selected, setSelected] = useState<ContainerFileInfo>();
  const [error, setError] = useState<string>();
  const [dirTree, setDirTree] = useState<TreeViewBaseItem<ExtendedTreeItemProps>[]>([]);
  const [files, setFiles] = useState<ContainerFileInfo[]>([]);
  const [crumbs, setCrumbs] = useState<BreadCrumItem[]>([
    {
      id: cid,
      label: 'Root',
      value: '',
    },
  ]);
  const getFileContents = async (refresh = false, itemId?: string) => {
    setError(undefined);
    setFiles([]);
    if (cid) {
      const joined = crumbs.map(c => c.value).join('/');
      const joinedPath = !joined ? '/' : joined;
      console.log('[joinedPath]:', joinedPath);
      const params = {
        id: cid,
        path: joinedPath,
      } as ContainerLsParams;
      const result = await invoke('container_ls_files', { params }) as ContainerLsResponse;
      if (!result) {
        setError('Could not open directory');
        return;
      }
      const { items: lsItems } = result;
      console.log('[items]:', lsItems);
      setFiles(lsItems.filter(v => !v.name?.startsWith('.')));
      const dirs = lsItems.filter(v => v.is_dir && !v.name?.startsWith('.'));
      console.log('[dirs]:', dirs);
      if (refresh) {
        setDirTree(dirs);
        // setItems(dirs);
      } else {
        const treeItem = dirTree.find(item => item.id === itemId);
        console.log('[treeItem]:', itemId, treeItem, dirTree);
        /* if (treeItem) {
          treeItem.children = dirs;
          setDirTree(oldTree);
        } */
      }
    }
  };
  useEffect(() => {
    getFileContents(true);
    // getDirectories();
  }, []);
  useEffect(() => {
    getFileContents().catch(e => {
      console.error(e);
      setError(e);
    });
  }, [crumbs]);

  const handleClose = () => {
    if (cid) {
      invoke('container_ls_shutdown', { params: { id: cid } });
      setOpen(false);
      onClose();
    }
  };

  const buildPathString = (crumbs: BreadCrumItem[]) => crumbs.map(c => c.value).join('/');
  const onDoubleClick = (item: ContainerFileInfo) => {
    if (!item.is_dir) {
      return;
    }
    console.log('[crumb]:', item);

    setCrumbs(old => {
      const newItems = Array.from(old);

      const newItem = {
        id: item.id as string,
        label: item.name as string,
        value: item.name as string,
      };
      newItems.push(newItem);
      const pathString = buildPathString(newItems);
      // newItem.id = pathString;
      console.log('[path]:', newItem, pathString);
      return newItems;
    });
    getFileContents(false, item.id as string);
  }
  const fileClicked = (item: ContainerFileInfo) => {
    console.log('[ctime]:', item.created, item.modified, intlFormatDistance(parseJSON(item.modified as string), Date.now()));
    
    setSelected(item);
  }

  const crumbItemClicked = (f: BreadCrumItem) => {
    console.log('[event]:', f);
    const index = crumbs.indexOf(f);
    setCrumbs(crumbs.splice(0, index+1));
  }

  const treeItemClicked = (_event: React.MouseEvent, itemId: string) => {
    console.log('[dirTree]:', itemId, dirTree);
    const treeItem = dirTree.find(item => item.id === itemId);
    console.log('[tree#item]:', itemId, treeItem);
    // treeRef.current?.setItemExpansion(event, itemId, true);
    setCrumbs([
      {
        id: cid,
        label: 'Root',
        value: '',
      },
      {
        id: treeItem?.id as string,
        label: treeItem?.name as string,
        value: treeItem?.real_path as string,
      }
    ]);
    getFileContents(false, itemId);
  };

  const updateBinary = async () => {
    await invoke('container_ls_update', { params: { id: cid }}).catch(console.error);
  }

  const openTerminal = async () => {
    const hostParams = {
      id: cid,
      ssh: true,
      hostname: true,
      user: true,
      ip: true,
    } as ContainerHostInfoQueryParams;
    const hostInfo = await invoke('query_host', { params: hostParams }) as ContainerHostInfo;
    console.log('[host]:', hostInfo);
    
    const params = {
      title: `${hostInfo.user ?? 'root'}@${hostInfo.ssh?.HostIp}`,
      user: hostInfo.user ?? 'root',
      host: hostInfo.ip,
      port: hostInfo.ssh?.HostPort,
    } as TermExecParams;
    await invoke('new_term_window', { params });
  }

  return (
    <Dialog
      open={visible}
      onClose={handleClose}
      aria-labelledby="scroll-dialog-title"
      aria-describedby="scroll-dialog-description"
      fullWidth
      maxWidth="xl"
      className="overflow-hidden"
    >
      <DialogTitle id="scroll-dialog-title">Container Explorer</DialogTitle>
      <DialogContent className="h-[720px]" sx={{ overflow: 'hidden' }}>
        <Toolbar className="h-auto overflow-hidden">
          <Breadcrumbs className="w-full overflow-hidden" separator={<NavigateNextIcon fontSize="small" />}>
            {crumbs.map((crumb, i) => (
              i === crumbs.length - 1 ? 
                <Typography key={i} sx={{ color: 'text.primary' }}>{ crumb.label }</Typography> :
                <Link key={i} underline="none" className="cursor-pointer hover:text-white" onClick={() => crumbItemClicked(crumb)}>{ crumb.label }</Link>
            ))}
          </Breadcrumbs>
        </Toolbar>
        <Box component="div" className="h-[650px] overflow-hidden" sx={{ overflow: 'hidden' }}>
          <Grid container spacing={2}>
            <Grid size={2}>
              <Box component="div" className="h-[650px] overflow-auto" sx={{ overflow: 'auto' }}>
                <RichTreeView items={dirTree} className="w-full" slots={{ item: CustomTreeItem }} apiRef={treeRef} onItemClick={treeItemClicked} getItemLabel={item => item.name as string} />
              </Box>
            </Grid>
            <Grid size={8}>
              <Box component="div" className="h-[650px] overflow-auto py-3" sx={{ overflow: 'auto' }}>
                <Grid container spacing={2}>
                  {files.length ? files.map((file, i) => (
                    <Box component="div" onClick={() => fileClicked(file)} onDoubleClick={() => onDoubleClick(file)}>
                      <Card key={i} className="w-36 items-center h-full cursor-pointer active:border-blue-600 bg-transparent">
                        <CardContent className="items-center py-1">
                          <div className="flex flex-col w-full space-x-1 items-center justify-center break-all">
                            {file.is_dir ? <FolderRounded sx={{ width: 48, height: 48 }} /> : <InsertDriveFileIcon sx={{ width: 48, height: 48 }} />}
                            <h5 className="text-md break-all">{ file.name }</h5>
                            <h6 className="text-xs truncate">{ file.file_type === 'dir' ? 'Folder' : '' }</h6>
                          </div>
                        </CardContent>
                      </Card>
                    </Box>
                  )) : (
                    <div className="flex flex-col items-center justify-center w-full h-max">
                      {error && <Alert severity="error" className="w-full">{ error }</Alert>}
                      <span>This folder is empty</span>
                    </div>
                  )}
                </Grid>
              </Box>
            </Grid>
            <Grid size={2}>
              <div className="flex flex-col">
                {selected ? (
                  <>
                  <h4 className="text-2xl">{ selected.name }</h4>
                  <h4 className="text-xs">{ selected.is_dir ? 'Folder' : selected.file_type?.split(';')?.[0] ?? selected.file_type }</h4>
                  <h4 className="text-md">Created { intlFormatDistance(parseJSON(selected.created as string), Date.now()) }</h4>
                  <h4 className="text-md">Modified { intlFormatDistance(parseJSON(selected.modified as string), Date.now()) }</h4>
                  <h4 className="text-xl">{ selected.size?.toLocaleString('en-US', { useGrouping: true }) } bytes</h4>
                  </>
                ) : <h4 className="text-sm">Select an item to show more information</h4>}
              </div>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={updateBinary} disabled>Update Binary</Button>
        <Button onClick={openTerminal}>Open terminal</Button>
        <Button disabled>Import</Button>
        <Button disabled>Export</Button>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

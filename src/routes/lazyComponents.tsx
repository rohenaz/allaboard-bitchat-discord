import React from 'react';

// Auth components
export const LoginPage = React.lazy(() =>
  import('../components/authForm/LoginPage').then((module) => ({
    default: module.LoginPage,
  })),
);

export const SignupPage = React.lazy(
  () => import('../components/authForm/SignupPage'),
);

// Dashboard components
export const Dashboard = React.lazy(() =>
  import('../components/dashboard/Dashboard').then((module) => ({
    default: module.Dashboard,
  })),
);

// Modals
export const ImportIDModal = React.lazy(
  () => import('../components/dashboard/modals/ImportIDModal'),
);

export const DirectMessageModal = React.lazy(
  () => import('../components/dashboard/modals/DirectMessageModal'),
);

export const PinChannelModal = React.lazy(
  () => import('../components/dashboard/modals/PinChannelModal'),
);

// Lists
export const ChannelList = React.lazy(
  () => import('../components/dashboard/ChannelList'),
);

export const ServerList = React.lazy(
  () => import('../components/dashboard/ServerList'),
);

export const UserList = React.lazy(() =>
  import('../components/dashboard/UserList').then((module) => ({
    default: module.UserList,
  })),
);

export const MemberList = React.lazy(() =>
  import('../components/dashboard/MemberList').then((module) => ({
    default: module.MemberList,
  })),
);

// Messages
export const Message = React.lazy(
  () => import('../components/dashboard/Message'),
);

export const MessageFiles = React.lazy(
  () => import('../components/dashboard/MessageFiles'),
);

export const FileRenderer = React.lazy(
  () => import('../components/dashboard/FileRenderer'),
);
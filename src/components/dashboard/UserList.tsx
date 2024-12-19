import type React from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useHandcash } from '../../context/handcash';
import { useYours } from '../../context/yours';
import { useActiveUser } from '../../hooks';
import { loadFriends } from '../../reducers/memberListReducer';
import { FetchStatus } from '../../utils/common';
import Avatar from './Avatar';
import ListItem from './ListItem';

interface RootState {
  memberList: {
    friendRequests: {
      loading: boolean;
      data: Array<{
        _id: string;
        paymail: string;
        logo?: string;
        alternateName?: string;
      }>;
    };
  };
  session: {
    user?: {
      idKey?: string;
    };
  };
}

interface UserListProps {
  users: Array<{
    _id: string;
    paymail: string;
    logo?: string;
    alternateName?: string;
  }>;
  loading?: boolean;
  title?: string;
  showFriendRequests?: boolean;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 1rem;
`;

const Title = styled.h2`
  padding: 0 10px;
  margin: 0;
  text-transform: uppercase;
  font-weight: 500;
  font-size: 12px;
  height: 24px;
  line-height: 24px;
  color: var(--channels-default);
`;

const UserList: React.FC<UserListProps> = ({
  users,
  loading,
  title,
  showFriendRequests,
}) => {
  const { authToken } = useHandcash();
  const { connected } = useYours();
  const params = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const session = useSelector((state: RootState) => state.session);

  const activeUserId = useMemo(() => params.user, [params.user]);

  useEffect(() => {
    if (showFriendRequests && (authToken || connected)) {
      dispatch(loadFriends());
    }
  }, [showFriendRequests, authToken, connected, dispatch]);

  const handleClick = useCallback(
    (id: string) => {
      if (id === session.user?.idKey) {
        return;
      }
      navigate(`/channels/@me/${id}`);
    },
    [navigate, session.user?.idKey],
  );

  const renderUser = useCallback(
    (user: {
      _id: string;
      paymail: string;
      logo?: string;
      alternateName?: string;
    }) => {
      const isActive = user._id === activeUserId;
      const isSelf = user._id === session.user?.idKey;

      return (
        <ListItem
          key={user._id}
          active={isActive}
          disabled={isSelf}
          onClick={() => handleClick(user._id)}
        >
          <Avatar
            size="32px"
            w="48px"
            bgcolor={'#000'}
            paymail={user.paymail}
            icon={user.logo}
          />
          {user.alternateName || user.paymail}
        </ListItem>
      );
    },
    [activeUserId, handleClick, session.user?.idKey],
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  if (
    !showFriendRequests &&
    (authToken === FetchStatus.LOADING || connected === FetchStatus.LOADING)
  ) {
    return <div>Loading wallet...</div>;
  }

  return (
    <Container>
      {title && <Title>{title}</Title>}
      {users?.map(renderUser)}
    </Container>
  );
};

export default UserList;

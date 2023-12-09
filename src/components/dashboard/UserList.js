import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FaPlus, FaUserFriends } from "react-icons/fa";
import { MdArrowBack } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { Link as RDLink } from "react-router-dom";
import styled from "styled-components";
import { useBap } from "../../context/bap/index.js";
import { useHandcash } from "../../context/handcash/index.js";
import { useRelay } from "../../context/relay/index.js";
import { useWindowWidth } from "../../hooks";
import { loadUsers } from "../../reducers/memberListReducer.js";
import { toggleSidebar } from "../../reducers/sidebarReducer.js";
import Avatar from "./Avatar";
import List from "./List";
import ListItem from "./ListItem";
import DirectMessageModal from "./modals/DirectMessageModal";

const Link = styled(RDLink)`
  &:hover {
    text-decoration: none;
  }
`;

const Container = styled.div`
  width: 240px;
  display: flex;
  flex-direction: column;
  text-overflow: ellipsis;
`;

const Header = styled.div`
  background-color: var(--background-secondary);
  border-bottom: 1px solid var(--background-tertiary);
  height: 48px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  padding: 0 16px;
`;

const Heading = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: var(--header-primary);
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  display: flex;
  align-items: center;
`;

const Content = styled.div`
  background-color: var(--background-secondary);
  flex: 1;
  height: calc(100dvh - 48px - 52px);
  padding: 10px 2px 10px 8px;
`;

const Footer = styled.div`
  background-color: var(--background-secondary-alt);
  height: 52px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px;
`;

const Username = styled.div`
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  color: var(--header-primary);
  font-weight: 600;
  font-size: 14px;
`;

const UserList = ({ activeUserId }) => {
  const { decIdentity } = useBap();

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(loadUsers());
  }, [dispatch]);

  // useEffect(() => {
  //   if (decIdentity) {
  //     dispatch(loadFriends(decIdentity.bapId));
  //   }
  // }, [decIdentity, dispatch]);

  const { paymail } = useRelay();
  const { profile } = useHandcash();

  // const user = useSelector((state) => state.session.user);
  const memberList = useSelector((state) => state.memberList);
  const session = useSelector((state) => state.session);
  const isInDesktop = useWindowWidth() > 768;
  const messages = useSelector((state) => state.chat.messages);
  const [showDirectMessageModal, setShowDirectMessageModal] = useState();
  const [hoveringUser, setHoveringUser] = useState();

  const mouseOver = useCallback(
    (id) => {
      if (id) {
        setHoveringUser(id);
      }
    },
    [hoveringUser]
  );

  const mouseOut = useCallback(
    (id) => {
      if (hoveringUser === id) {
        setHoveringUser(undefined);
      }
    },
    [hoveringUser]
  );

  const renderUser = useCallback(
    (id) => {
      console.log({ member: memberList.byId[id] });
      const member = memberList.byId[id];
      // TODO avatar needs a vallback image
      return (
        <Link
          key={id}
          to={`/@/${id}`}
          onClick={() => !isInDesktop && dispatch(toggleSidebar())}
        >
          <ListItem
            icon={<Avatar w={32} h={32} icon={member?.identity.logo} />}
            text={member.identity?.alternateName || id || "global"}
            style={{
              gap: "8px",
              padding: "8px 4px",
            }}
            id={id}
            isPinned={false}
            onMouseEnter={(e) => mouseOver(e.target.id)}
            onMouseLeave={(e) => mouseOut(e.target.id)}
            hasActivity={
              id &&
              messages?.allIds?.some(
                (mid) => messages.byId[mid]?.AIP?.bapId === id
              )
            }
            isActive={id === activeUserId || (!id && !activeUserId)}
            showPin={false}
            onClickPin={() => {}}
          />
        </Link>
      );
    },
    [hoveringUser, messages, isInDesktop, activeUserId, memberList.allIds]
  );

  const clickDm = useCallback(() => {
    setShowDirectMessageModal(true);
  }, [showDirectMessageModal]);

  const user = useMemo(() => {
    return session.memberList?.signers.byId[session.user.idKey];
  }, [session]);

  return (
    <Container className="disable-select">
      <Header>
        <Heading>
          <MdArrowBack style={{ marginRight: ".5rem" }} />
          <Link to={`/channels`}>Bitchat [Nitro]</Link>
        </Heading>
      </Header>
      <Content className="scrollable">
        <List gap={`2px`} style={{ width: "100%" }}>
          <Link
            key={`friends-menu-item-link`}
            to={`/friends`}
            onClick={() => !isInDesktop && dispatch(toggleSidebar())}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: " space-between",
            }}
          >
            <ListItem
              showPin={false}
              style={{
                gap: "8px",
                padding: "8px 4px",
                width: "100%",
              }}
              icon={
                <FaUserFriends
                  width={`32px`}
                  height={`32px`}
                  style={{ margin: "0 .5rem" }}
                />
              }
              text={`Friends`}
              id={`friends-menu-item`}
              onMouseEnter={(e) => mouseOver(e.target.id)}
              onMouseLeave={(e) => mouseOut(e.target.id)}
            />
          </Link>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: " space-between",
              marginTop: `1rem`,
              marginBottom: ".5rem",
            }}
            onClick={clickDm}
          >
            <ListItem
              text={`DIRECT MESSAGES`}
              textStyle={{ fontSize: ".85rem", width: "100%" }}
            />
            <FaPlus
              style={{
                color: "#EEE",
                marginRight: ".5rem",
                width: "12px",
                height: "12px",
              }}
            />
          </div>
        </List>
        <List gap="2px">
          {!memberList.loading && memberList.allIds.map(renderUser)}
        </List>
      </Content>
      <Footer>
        <Avatar
          size="21px"
          w="32px"
          // bgColor={user.avatarColor}
          bgcolor={"#000"}
          status="online"
          paymail={user?.paymail || paymail || profile?.paymail}
        />
        {/* <Username>{user.username}</Username> */}
        <Username>
          {user?.identity?.alternateName || paymail || profile?.paymail}
        </Username>
      </Footer>
      <DirectMessageModal
        open={showDirectMessageModal}
        onClose={() => setShowDirectMessageModal(false)}
      />
    </Container>
  );
};

export default UserList;

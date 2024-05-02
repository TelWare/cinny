import React, { useState, useEffect, useRef, useContext } from 'react';
import PropTypes from 'prop-types';
import './CreateRoom.scss';
// import { Customtagbar } from "../../../../config/global.style"
import { twemojify } from '../../util/twemojify';
import initMatrix from '../../client/initMatrix';
import cons from '../../client/state/cons';
import navigation from '../../client/state/navigation';
import { selectRoom, openReusableContextMenu } from '../../client/action/navigation';
import * as roomActions from '../../client/action/room';
import { isRoomAliasAvailable, getIdServer } from '../../util/matrixUtil';
import { getEventCords } from '../../util/common';
import { Space, Tag, Tooltip } from 'antd';
import Text from '../../atoms/text/Text';
import Button from '../../atoms/button/Button';
import Toggle from '../../atoms/button/Toggle';
import IconButton from '../../atoms/button/IconButton';
import { MenuHeader, MenuItem } from '../../atoms/context-menu/ContextMenu';
import Input from '../../atoms/input/Input';
import Spinner from '../../atoms/spinner/Spinner';
import SegmentControl from '../../atoms/segmented-controls/SegmentedControls';
import Dialog from '../../molecules/dialog/Dialog';
import SettingTile from '../../molecules/setting-tile/SettingTile';
import HashPlusIC from '../../public/res/ic/outlined/hash-plus.svg';
import SpacePlusIC from '../../public/res/ic/outlined/space-plus.svg';
import HashIC from '../../public/res/ic/outlined/hash.svg';
import UserIC from '../../public/res/ic/outlined/user.svg';
import RemoveCloseIcon from '../../../Icons/RemoveClose';
import HashLockIC from '../../public/res/ic/outlined/hash-lock.svg';
import HashGlobeIC from '../../public/res/ic/outlined/hash-globe.svg';
import SpaceIC from '../../public/res/ic/outlined/space.svg';
import SpaceLockIC from '../../public/res/ic/outlined/space-lock.svg';
import SpaceGlobeIC from '../../public/res/ic/outlined/space-globe.svg';
import ChevronBottomIC from '../../public/res/ic/outlined/chevron-bottom.svg';
import CrossIC from '../../public/res/ic/outlined/cross.svg';
import RoomTile from '../../molecules/room-tile/RoomTile';
import ChatWrapperContext from '../../ChatWrapper2/ChatWrapper2Context';

function CreateRoomContent({ isSpace, parentId, onRequestClose }) {
  const [joinRule, setJoinRule] = useState(parentId ? 'restricted' : 'invite');
  const [isEncrypted, setIsEncrypted] = useState(true);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [creatingError, setCreatingError] = useState(null);
  const [isSearching, updateIsSearching] = useState(false);
  const [searchQuery, updateSearchQuery] = useState({});
  const [isValidAddress, setIsValidAddress] = useState(null);
  const [addressValue, setAddressValue] = useState(undefined);
  const [roleIndex, setRoleIndex] = useState(0);
  const [allUsers, updateAllUsers] = useState([]);
  const [users, updateUsers] = useState([]);
  const addressRef = useRef(null);

  const { selectedUser, setSelectedUser } = useContext(ChatWrapperContext);

  const mx = initMatrix.matrixClient;
  const userHs = getIdServer(mx.getUserId());

  useEffect(() => {
    const { roomList } = initMatrix;
    const onCreated = (roomId) => {
      setIsCreatingRoom(false);
      setCreatingError(null);
      setIsValidAddress(null);
      setAddressValue(undefined);

      if (!mx.getRoom(roomId)?.isSpaceRoom()) {
        selectRoom(roomId);
      }
      onRequestClose();
    };
    roomList.on(cons.events.roomList.ROOM_CREATED, onCreated);
    return () => {
      roomList.removeListener(cons.events.roomList.ROOM_CREATED, onCreated);
    };
  }, []);

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    const { target } = evt;

    if (isCreatingRoom) return;
    if (selectedUser.length === 0) {
      setCreatingError('Add some user in room');
      return;
    }
    setIsCreatingRoom(true);
    setCreatingError(null);

    const name = target.name.value;
    let topic = target.topic.value;
    if (topic.trim() === '') topic = undefined;
    let roomAlias;
    if (joinRule === 'public') {
      roomAlias = addressRef?.current?.value;
      if (roomAlias.trim() === '') roomAlias = undefined;
    }

    const powerLevel = roleIndex === 1 ? 101 : undefined;

    const usersId = [];

    selectedUser.forEach((user) => {
      usersId.push(`${user.user_id}`);
    });
    try {
      await roomActions.createRoom({
        usersId,
        name,
        topic,
        joinRule,
        alias: roomAlias,
        // isEncrypted: (isSpace || joinRule === 'public') ? false : isEncrypted,
        powerLevel,
        isSpace,
        parentId,
      });
    } catch (e) {
      if (e.message === 'M_UNKNOWN: Invalid characters in room alias') {
        setCreatingError('ERROR: Invalid characters in address');
        setIsValidAddress(false);
      } else if (e.message === 'M_ROOM_IN_USE: Room alias already taken') {
        setCreatingError('ERROR: This address is already in use');
        setIsValidAddress(false);
      } else setCreatingError(e.message);
      setIsCreatingRoom(false);
    }
  };

  const validateAddress = (e) => {
    const myAddress = e.target.value;
    setIsValidAddress(null);
    setAddressValue(e.target.value);
    setCreatingError(null);

    setTimeout(async () => {
      if (myAddress !== addressRef.current.value) return;
      const roomAlias = addressRef.current.value;
      if (roomAlias === '') return;
      const roomAddress = `#${roomAlias}:${userHs}`;

      if (await isRoomAliasAvailable(roomAddress)) {
        setIsValidAddress(true);
      } else {
        setIsValidAddress(false);
      }
    }, 1000);
  };

  const joinRules = ['invite', 'restricted', 'public'];
  const joinRuleShortText = ['Private', 'Restricted', 'Public'];
  const joinRuleText = [
    'Private (invite only)',
    'Restricted (space member can join)',
    'Public (anyone can join)',
  ];
  const jrRoomIC = [HashLockIC, HashIC, HashGlobeIC];
  const jrSpaceIC = [SpaceLockIC, SpaceIC, SpaceGlobeIC];
  const handleJoinRule = (evt) => {
    openReusableContextMenu('bottom', getEventCords(evt, '.btn-surface'), (closeMenu) => (
      <>
        <MenuHeader>Visibility (who can join)</MenuHeader>
        {joinRules.map((rule) => (
          <MenuItem
            key={rule}
            variant={rule === joinRule ? 'positive' : 'surface'}
            iconSrc={
              isSpace ? jrSpaceIC[joinRules.indexOf(rule)] : jrRoomIC[joinRules.indexOf(rule)]
            }
            onClick={() => {
              closeMenu();
              setJoinRule(rule);
            }}
            disabled={!parentId && rule === 'restricted'}
          >
            {joinRuleText[joinRules.indexOf(rule)]}
          </MenuItem>
        ))}
      </>
    ));
  };

  // const handleKeyPress = (event) => {
  //   if (event.key === 'Enter') {
  //    searchUser(searchQuery)
  //   }
  // };

  async function searchUser(username) {
    const inputUsername = username.trim();

    if (inputUsername === searchQuery.username) {
      return;
    }

    if (isSearching || inputUsername === '') {
      updateUsers([]);
      updateSearchQuery({});
      return;
    }

    const isInputUserId = inputUsername[0] === '@' && inputUsername.indexOf(':') > 1;
    updateIsSearching(true);
    updateSearchQuery({ username: inputUsername });

    if (isInputUserId) {
      try {
        const result = await mx.getProfileInfo(inputUsername);
        updateUsers([
          {
            user_id: inputUsername,
            display_name: result.displayname,
            avatar_url: result.avatar_url,
          },
        ]);
      } catch (e) {
        updateSearchQuery({ error: `${inputUsername} not found!` });
      }
    } else {
      try {
        const result = await mx.searchUserDirectory({
          term: inputUsername,
          limit: 20,
        });

        if (result.results.length === 0) {
          updateSearchQuery({
            error: `No matches found for "${inputUsername}"!`,
          });
          updateUsers([]);
          updateIsSearching(false);
          return;
        }
        updateUsers(result.results);
      } catch (e) {
        updateSearchQuery({ error: 'Something went wrong!' });
      }
    }
    updateIsSearching(false);
  }

  const handleAddUser = (user) => {
    setSelectedUser((prev) => [...prev, user]);
  };

  const handleDeleteUser = (userId) => {
    const updatedUsers = selectedUser.filter((user) => user.user_id !== userId);
    setSelectedUser(updatedUsers);
  };

  function renderUserList() {
    const showUser = users.length !== 0 ? users : allUsers;
    return showUser.map((user) => {
      const userId = user.user_id;
      const name = typeof user.display_name === 'string' ? user.display_name : userId;

      const isUserAdded = selectedUser.some((selected) => selected.user_id === userId);
      return (
        <RoomTile
          key={userId}
          avatarSrc={user.avatar_url}
          name={name}
          id={userId}
          options={
            <Button disabled={isUserAdded} onClick={() => handleAddUser(user)} variant="primary">
              Add
            </Button>
          }
          desc={null}
        />
      );
    });
  }

  return (
    <div className="create-room">
      <form className="create-room__form" onSubmit={handleSubmit}>
        <SettingTile
          title="Visibility"
          options={
            <Button onClick={handleJoinRule} iconSrc={ChevronBottomIC}>
              {joinRuleShortText[joinRules.indexOf(joinRule)]}
            </Button>
          }
          content={
            <Text variant="b3">{`Select who can join this ${isSpace ? 'space' : 'channel'}.`}</Text>
          }
        />
        {joinRule === 'public' && (
          <div>
            <Text className="create-room__address__label" variant="b2">
              {isSpace ? 'Space address' : 'Channel address'}
            </Text>
            <div className="create-room__address">
              <Text variant="b1">#</Text>
              <Input
                value={addressValue}
                onChange={validateAddress}
                state={isValidAddress === false ? 'error' : 'normal'}
                forwardRef={addressRef}
                placeholder="my_address"
                required
              />
              <Text variant="b1">{`:${userHs}`}</Text>
            </div>
            {isValidAddress === false && (
              <Text className="create-room__address__tip" variant="b3">
                <span
                  style={{ color: 'var(--bg-danger)' }}
                >{`#${addressValue}:${userHs} is already in use`}</span>
              </Text>
            )}
          </div>
        )}
        {/* {!isSpace && joinRule !== "public" && (
          <SettingTile
            title="Enable end-to-end encryption"
            options={
              <Toggle isActive={isEncrypted} onToggle={setIsEncrypted} />
            }
            content={
              <Text variant="b3">
                You can’t disable this later. Bridges & most bots won’t work
                yet.
              </Text>
            }
          />
        )} */}
        <SettingTile
          title="Select your role"
          options={
            <SegmentControl
              selected={roleIndex}
              segments={[{ text: 'Admin' }, { text: 'Founder' }]}
              onSelect={setRoleIndex}
            />
          }
          content={
            <Text variant="b3">Selecting Admin sets 100 power level whereas Founder sets 101.</Text>
          }
        />
        <Input name="topic" minHeight={174} resizable label="Topic (optional)" />
        <div className="create-room__name-wrapper">
          <Input name="name" label={`${isSpace ? 'Space' : 'Channel'} name`} required />
        </div>

        <div className="create-room__search-user-wrapper">
          <Input
            onChange={(e) => updateSearchQuery(e.target.value)}
            name="search"
            label={`${isSpace ? 'Space' : 'Search'} user`}
            // onKeyDown={handleKeyPress}
            // required
          />
          <Button
            // disabled={searchQuery ? false : true}
            iconSrc={isSpace ? SpacePlusIC : UserIC}
            onClick={() => searchUser(searchQuery)}
            variant="primary"
          >
            Search
          </Button>
        </div>
        {selectedUser.length !== 0 && (
          <div className="person-search-result">
            {/* <Customtagbar> */}
            <Space className="space-wrap">
              {selectedUser.map((userData) => {
                return (
                  <Tooltip title={`${userData.user_id}`} key={userData.user_id}>
                    <Tag
                      closable
                      closeIcon={<RemoveCloseIcon />}
                      onClose={() => handleDeleteUser(userData.user_id)}
                    >
                      <span className="profilecover-icon-wrapper">
                        <img
                          src={userData.avatar_url}
                          alt={userData.display_name}
                          className="avatar"
                        />
                      </span>

                      <div className="data">{userData.display_name}</div>
                    </Tag>
                  </Tooltip>
                );
              })}
            </Space>
            {/* </Customtagbar> */}
          </div>
        )}
        <div className="invite-user__search-status">
          {searchQuery.username && isSearching && (
            <div className="flex--center">
              <Spinner size="small" />
              <Text variant="b2">{`Searching for user "${searchQuery.username}"...`}</Text>
            </div>
          )}
          {typeof searchQuery.username !== 'undefined' && !isSearching && (
            <Text variant="b2">{`Search result for user "${searchQuery.username}"`}</Text>
          )}
          {searchQuery.error && (
            <Text className="invite-user__search-error" variant="b2">
              {searchQuery.error}
            </Text>
          )}
        </div>

        {!searchQuery.username && isSearching && (
          <div className="flex--center">
            <Spinner size="small" />
          </div>
        )}

        {allUsers.length !== 0 && <div className="search-user__content">{renderUserList()}</div>}

        <div className="create-channel__submit-button">
          <Button
            disabled={isValidAddress === false || isCreatingRoom}
            iconSrc={isSpace ? SpacePlusIC : HashPlusIC}
            type="submit"
            variant="primary"
          >
            Create Channel
          </Button>
        </div>

        {isCreatingRoom && (
          <div className="create-room__loading">
            <Spinner size="small" />
            <Text>{`Creating ${isSpace ? 'space' : 'Channel'}...`}</Text>
          </div>
        )}
        {typeof creatingError === 'string' && (
          <Text className="create-room__error" variant="b3">
            {creatingError}
          </Text>
        )}
      </form>
    </div>
  );
}
CreateRoomContent.defaultProps = {
  parentId: null,
};
CreateRoomContent.propTypes = {
  isSpace: PropTypes.bool.isRequired,
  parentId: PropTypes.string,
  onRequestClose: PropTypes.func.isRequired,
};

function useWindowToggle(setSelectedUser) {
  const [create, setCreate] = useState(null);

  useEffect(() => {
    const handleOpen = (isSpace, parentId) => {
      setCreate({
        isSpace,
        parentId,
      });
    };
    navigation.on(cons.events.navigation.CREATE_ROOM_OPENED, handleOpen);
    return () => {
      navigation.removeListener(cons.events.navigation.CREATE_ROOM_OPENED, handleOpen);
    };
  }, []);

  const onRequestClose = () => {
    setSelectedUser([]);
    setCreate(null);
  };

  return [create, onRequestClose];
}

function CreateRoom() {
  const { setSelectedUser } = useContext(ChatWrapperContext);
  const [create, onRequestClose] = useWindowToggle(setSelectedUser);
  const { isSpace, parentId } = create ?? {};
  const mx = initMatrix.matrixClient;
  const room = mx.getRoom(parentId);

  return (
    <Dialog
      isOpen={create !== null}
      title={
        <Text variant="s1" weight="medium" primary>
          {parentId ? twemojify(room.name) : 'Home'}
          <span style={{ color: 'var(--tc-surface-low)' }}>
            {` — create ${isSpace ? 'space' : 'channel'}`}
          </span>
        </Text>
      }
      contentOptions={<IconButton src={CrossIC} onClick={onRequestClose} tooltip="Close" />}
      onRequestClose={onRequestClose}
    >
      {create ? (
        <CreateRoomContent isSpace={isSpace} parentId={parentId} onRequestClose={onRequestClose} />
      ) : (
        <div />
      )}
    </Dialog>
  );
}

export default CreateRoom;

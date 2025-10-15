import React, {useEffect, useState, useRef, useMemo, useLayoutEffect} from 'react';
import {axiosInstance as axios} from '../api/axiosInstance';
import {Container, Row, Form, Button, Card} from 'react-bootstrap';
import {useParams, useNavigate} from 'react-router-dom';
import {useSocket} from '../context/SocketContext';
import {useAuth} from '../auth/useAuth'; 
import SidePanel from '../components/SidePanel';
import NameModal from '../components/NameModal';
import MessageModal from '../components/MessageModal';

export default function Chat() {
    const {roomId} = useParams();
    const [roomName, setRoomName] = useState("");
    const [tempName, setTempName] = useState(roomName);
    const [adminId, setAdminId] = useState("");
    
    const [messages, setMessages] = useState([]);
    const hasMore = useRef({before: true, after: true});
    //const [loading, setLoading] = useState(false);

    const [errMessage, setErrMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);

    const [search, setSearch] = useState({
        searchMode: false,
        index: 0,
        result: [],
        hasMore: true,
    }); //하나로 관리하기

    const searchInputRef = useRef('');
    const firstScrollRef = useRef(true); // 일반 채팅 초기 열람(스크롤 최하단 위치)

    const lastMsgRef = useRef(null); //최신 메시지 위치(최하단 메시지): 일반 모드 스크롤 위해
    const lastMessageIdRef = useRef({before: null, after: null}); // 검색중 메시지 갱신

    const keywordRef = useRef(null);

    const [newPreview, setNewPreview] = useState(null);

    const [input, setInput] = useState('');

    const containerRef = useRef(null);
    const isProgrammaticScroll = useRef(false);

    const {socket} = useSocket();
    const {memberId, loading} = useAuth();
    const navigate = useNavigate();

    const [selectedId, setSelectedId] = useState(null);

    const [sidePanel, setSidePanel] = useState(false);
    const [showNameModal, setShowNameModal] = useState(false);

    const centerRef = useRef(null);

    let searchLoading = false;

    const [isDeleted, setIsDeleted] = useState(false);
    const canceledRef = useRef(false);

    const merged = useMemo(() => {
        if (search.result.length === 0) return [];

        const before = search.result[search.index].before;
        const center = search.result[search.index].center;
        const after = search.result[search.index].after;
        lastMessageIdRef.current.before = before.messages[0]?._id.toString();
        lastMessageIdRef.current.after = after.messages[after.messages.length - 1]?._id.toString();
        return [...before.messages, ...center.messages, ...after.messages];
    }, [search]);

    const centerId = useMemo(() => {
        if (search.result.length === 0) return null;
        return search.result[search.index].center.messages[0]._id.toString();
    }, [search]);

    // 채팅방 조회
    const getChatRoom = async () => {
        if (canceledRef.current) return;
        try {
            const res = await axios.get(`/chat/${roomId}`);
            if (res.data.success) {
                const adminId = res.data.room.admin;
                setAdminId(adminId);
                const name = res.data.room.name;
                setRoomName(name);
            }
        } catch (err) {
            const errorCode = err?.response?.data?.code?.toString();
            const errorMessage = err?.response?.data?.message?.toString();

            if (errorCode) {
                switch (errorCode) {
                    case 'DB001':
                    case 'AUTH005':
                        setErrMessage(`${errorMessage}`);
                        setShowErrorModal(true);
                        navigate(`/chat/show/${memberId}`);
                        break;
                
                    default:
                        setErrMessage(`${errorMessage}`);
                        setShowErrorModal(true);
                        break;
                }
            } else {
                setErrMessage('채팅방을 불러오지 못했습니다.');
                setShowErrorModal(true);
            }
        }
    }

    //관리자 권한 위임
    const delegateAdmin = async (receiver) => {
        if (!window.confirm('이 사용자에게 관리자 권한을 위임하시겠습니까?')) return;

        try {
            const res = await axios.patch(`/chat/${roomId}/delegate`,
                {receiver: receiver},
            );

            if (res.data.success) {
                alert('관리자 권한이 위임되었습니다.');
                setAdminId(receiver);
                return true;
            }
        } catch (err) {
            console.error('관리자 권한 위임 오류: ', err);
            const errorCode = err?.response?.data?.code?.toString();
            const errorMessage = err?.response?.data?.message?.toString();

            if (errorCode) {
                setErrMessage(`${errorMessage}`);
                setShowErrorModal(true);
            } else {
                setErrMessage('관리자 권한 위임에 실패했습니다.');
                setShowErrorModal(true);
            }
        }
    }

    // 메시지 불러오기
    const getMessages = async (direction = "before", lastMessageId = null) => {
        if (canceledRef.current) return;
        try {
            const res = await axios.get(`/chat/${roomId}/message`,
                {params: {lastMessageId, direction}},
            );

            const newMessages = res.data.messages;

            if (search.searchMode) {
                if (direction === 'before') {
                    setSearch((prev) => {
                        const newMsg = prev.result.map((item, idx) =>
                            idx === search.index ? {...item,
                                before: {...item.before,
                                    messages:[...newMessages, ...(item.before.messages || []),],
                                    hasMore: res.data.hasMore,},} : item
                        );
                        return {...prev, result: newMsg};
                    });
                } else {
                    setSearch((prev) => {
                        const newMsg = prev.result.map((item, idx) =>
                            idx === search.index ? {...item,
                                after: {...item.after,
                                    messages: [...(item.after.messages || []), ...newMessages,],
                                    hasMore: res.data.hasMore,},} : item
                        );
                        return {...prev, result: newMsg};
                    });
                }
            } else {
                if (!res.data.hasMore) hasMore.current[direction] = false;
                setMessages((prev) => [...newMessages, ...prev]);
            }
        } catch (err) {
            const errorCode = err?.response?.data?.code?.toString();
            const errorMessage = err?.response?.data?.message?.toString();

            if (errorCode) {
                switch (errorCode) {
                    case 'DB001':
                    case 'AUTH005':
                        setErrMessage(`${errorMessage}`);
                        setShowErrorModal(true);
                        navigate(`/chat/show/${memberId}`);
                        break;
                
                    default:
                        setErrMessage(`${errorMessage}`);
                        setShowErrorModal(true);
                        break;
                }
            } else {
                setErrMessage('채팅 내역을 불러오지 못했습니다.');
                setShowErrorModal(true);
            }
        }
    }

    // 검색 버튼
    const searchSubmit = () => {
        searchInputRef.current = keywordRef.current.value;
        if (searchInputRef.current.length === 0) {
            alert('검색어를 입력해주세요.');
            return;
        }
        
        setSearch((prev) => ({...prev, searchMode: true, index: 0, result: []}));
        
        searchMessages();

        scrollToMessage();
    }

    // 검색 결과 불러오기
    const searchMessages = async () => {
        if (loading || canceledRef.current) return;
        //setIsSearchMode(true);

        try {
            const res = await axios.get(`/chat/${roomId}/search`,
                {params:{keyword: searchInputRef.current}},
            );

            if (res.data.message.length === 0) {
                alert('검색 결과가 없습니다.');
                return;
            }

            const newResult = res.data;

            setSearch((prev) => ({...prev, searchMode: true, hasMore: newResult.hasMore,
                result: [...prev.result, ...newResult.message]}));

        } catch (err) {
            const errorCode = err?.response?.data?.code?.toString();
            const errorMessage = err?.response?.data?.message?.toString();

            if (errorCode) {
                alert(`${errorMessage}`);
            } else {
                alert('검색 결과를 불러오지 못했습니다.');
            }
        }
    }

    const endSearchMode = () => {
        setSearch((prev) => ({...prev, searchMode: false, index: 0}));
        centerRef.current = null;
        //firstScrollRef.current = true; //검색 종료 후 스크롤 초기화 할 것인지?
    }

    useLayoutEffect(() => { // 검색 실행시 스크롤 안 움직이는 문제 해결 위해
        if (centerId && centerRef.current) {
            scrollToMessage();
        }
    }, [search]);

    // 검색 결과의 center로 이동
    const scrollToMessage = () => {
        const container = containerRef.current;
        if (!container) return;

        if (centerRef.current) {
            isProgrammaticScroll.current = true;
            centerRef.current.scrollIntoView({block: 'center', behavior: 'smooth'});
            setTimeout(() => {
                isProgrammaticScroll.current = false;
            }, 500);
        }
    }

    const prefetchSearch = async () => {
        if (!search.hasMore) return;

        const lastId = search.result[search.result.length - 1].center.messages[0]._id.toString();
        if (lastId) {
            try {
                const res = await axios.get(`/chat/${roomId}/search`,
                    {params: {keyword: searchInputRef.current,
                        lastMessageId: lastId}},
                );

                if (res.data.success) {
                    const result = res.data;
                    setSearch((prev) => ({...prev, hasMore: result.hasMore,
                        result: [...prev.result, ...result.message]}));
                    setTimeout(() => {
                        searchLoading = false;
                    }, 500);
                    
                }
            
            } catch (err) {
                const errorCode = err?.response?.data?.code?.toString();
                const errorMessage = err?.response?.data?.message?.toString();

                if (errorCode) {
                    alert(`${errorMessage}`);
                } else {
                    alert('검색 결과를 불러오지 못했습니다.');
                }
            }
        }
        
        searchLoading = false;
    }

    
    const moveNext = () => {
        if (search.result.length === 0) return;

        const nextIndex = (search.index + 1 > search.result.length - 1 && !search.hasMore)
            ? search.index : search.index + 1;

        if (nextIndex === search.index) {
            alert('마지막 검색 결과입니다.');
            return;
        }

        setSearch((prev) => ({...prev, index: nextIndex}));

        if (!searchLoading && search.hasMore && search.index >= search.result.length - 7) {
            prefetchSearch();
            searchLoading = true;
        }
    }

    
    const movePrev = () => {
        if (search.result.length === 0) return;

        if (search.index === 0) {
            alert('가장 최근 검색 결과입니다.');
            return;
        }

        const prevIndex = search.index <= 0 ? 0 : search.index - 1;

        setSearch((prev) => ({...prev, index: prevIndex}));
    }

    // 최신 메시지 도착시 확인 위해 스크롤 최하단으로
    const scrollToBottom = () => {
        if (search.searchMode) {
            const confirm = window.confirm('검색을 종료하시겠습니까?');
            if (!confirm) return;
            setSearch((prev) => ({...prev, searchMode: false, result: []}));
            centerRef.current = null;
        }
        const container = containerRef.current;
        if (container) {
            if (lastMsgRef.current) {
                lastMsgRef.current.scrollIntoView({behavior: 'auto'});
                firstScrollRef.current = false;
            } else {
                setTimeout(() => {
                    if (lastMsgRef.current) {
                        lastMsgRef.current.scrollIntoView({behavior: 'auto'});
                    } else {
                        container.scrollTop = container.scrollHeight;
                    }
                    firstScrollRef.current = false;
                }, 700);
            }
        }
    };

    // 검색 useEffect
    useEffect(() => {
        if (canceledRef.current || !search.searchMode) return;
        if (search.result.length === 0) return;

        const container = containerRef.current;
        if (!containerRef || !container) return;

        const handleScrollSearch = () => {
            if (isProgrammaticScroll.current || loading) return;
            if (container.scrollTop === 0 && search.result[search.index].before.hasMore) {
                
                getMessages('before', lastMessageIdRef.current.before);
                const prevScroll = container.scrollHeight;

                requestAnimationFrame(() => {
                    const newScroll = container.scrollHeight;
                    isProgrammaticScroll.current = true;
                    container.scrollTop = newScroll - prevScroll;

                    requestAnimationFrame(() => {
                        isProgrammaticScroll.current = false;
                    });
                });
            }

            if (container.scrollTop + container.clientHeight >= container.scrollHeight
                    && search.result[search.index].after.hasMore) {
                //clientHeight: 현재 화면의 최대 높이
                //scrollHeight: 출력된 전체 메시지 스크롤의 높이
                if (lastMessageIdRef.current.after) {
                    getMessages('after', lastMessageIdRef.current.after);
                }
            }
        };

        containerRef.current?.addEventListener('scroll', handleScrollSearch);

        return () => containerRef.current?.removeEventListener('scroll', handleScrollSearch);

    }, [roomId, memberId, loading, search, searchSubmit, isDeleted]);

    // 일반 채팅 useEffect
    useEffect(() => {
        if (canceledRef.current) return;
        getChatRoom();

        if (firstScrollRef.current) {
            scrollToBottom();
            //나머지는 최신 메시지 도착시에 새 메시지(미리보기) 클릭할 때만 사용하도록
            firstScrollRef.current = false;
        }
        const container = containerRef.current;
        if (!container) return;

        const handleScrollChat = () => {
            if (isProgrammaticScroll.current || loading || search.searchMode) return;

            if (container.scrollTop === 0 && hasMore.current.before) {
                const prevScroll = container.scrollHeight;

                const lastMessageId = messages[0]?._id;
                getMessages('before', lastMessageId);

                requestAnimationFrame(() => {
                    const newScroll = container.scrollHeight;
                    isProgrammaticScroll.current = true;
                    container.scrollTop = newScroll - prevScroll;

                    requestAnimationFrame(() => {
                        isProgrammaticScroll.current = false;
                    });
                });
            }

            if (container.scrollTop + container.clientHeight >= container.scrollHeight && hasMore.current.after) {
                const lastMessageId = messages[messages.length - 1]._id;
                getMessages('after', lastMessageId);
            }
        };

        container.addEventListener('scroll', handleScrollChat);

        return () => container.removeEventListener('scroll', handleScrollChat);

    }, [roomId, memberId, socket, messages, loading, search, isDeleted]);

    useEffect(() => {

        if (messages.length === 0 && !loading) {
            getMessages();
        }

        //socket
        socket.on('send-message', ({chat}) => {
            //읽는중 새로 전송된 메시지 업로드 및 읽음 처리
            setMessages((prev) => [...prev, chat]);

            const container = containerRef.current;
            if (!container) return;

            const isBottom = container.scrollHeight - container.scrollTop
                <= container.clientHeight + 10;

            if (!isBottom) {
                //맨 아래가 아니라면 미리보기 알림
                setNewPreview(chat.content);
            } else {
                //맨 아래라면 자동으로 스크롤
                isProgrammaticScroll.current = true;
                requestAnimationFrame(() => {
                    //스크롤 최하단으로
                    container.scrollTop = container.scrollHeight;
                    isProgrammaticScroll.current = false;
                });
            }
            //socket.emit으로 document.visibilityState 확인해서
            //addRead(chatService) 처리하도록?????
            socket.emit('add-read', ({roomId, chat}));
        });

        socket.on('update-read-all', ({joinedId, readInfo}) => {
            // 다른 유저가 접속했을 때 기존 접속 유저 리렌더링
            const {prevReadId, lastReadId} = readInfo;
            if (joinedId === memberId) return;
            const prevReadTime = objectIdToTimestamp(prevReadId);
            const lastReadTime = objectIdToTimestamp(lastReadId);
            
            setMessages(prev =>
                prev.map(msg => {
                    const current = objectIdToTimestamp(msg._id);
                    const readAfter = current > lastReadTime;
                    const readBefore = current <= prevReadTime;
                    if (readAfter || readBefore) return msg;
                    return {
                        ...msg,
                        unread: Math.max(0, msg.unread - 1),
                    };
                })
            );

            setSearch(prev => {
                if (!prev.searchMode) return prev;
                return {
                    ...prev,
                    result: prev.result.map(item => {
                        const updated = {};
                        for (const key of ['before', 'center', 'after']) {
                            if (!item[key] || !item[key].messages) continue;
                            updated[key] = {
                                ...item[key],
                                messages: item[key].messages.map(msg => {
                                    const current = objectIdToTimestamp(msg._id);
                                    const readAfter = current > lastReadTime;
                                    const readBefore = current <= prevReadTime;
                                    if (readAfter || readBefore) return msg;
                                    return {
                                        ...msg,
                                        unread: Math.max(0, msg.unread - 1),
                                    };
                                }),
                            };
                        }
                        return {
                            ...item,
                            ...updated,
                        };
                    }),
                }
            });
            
        });

        socket.on('update-read', ({chatId, unread}) => {
            setMessages((prev) => prev.map((msg) =>
                msg._id === chatId ? {...msg, unread: unread} : msg));
        });

        socket.on('leave-notice', ({systemMessage}) => {
            setMessages((prev) => [...prev, systemMessage]);
        });

        socket.on('room-deleted', ({deletedRoomId}) => {
            if (roomId === deletedRoomId) {
                canceledRef.current = true;
                setIsDeleted(true);
                alert('해당 채팅방은 삭제되었습니다.');
                navigate(`/chat/show/${memberId}`);
            }
        });

        const handleDeletedMessage =(updateMsg) => {
            setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                    msg._id === updateMsg ? {...msg, deleted: true} : msg));
        };

        socket.on('update-deleted', handleDeletedMessage);

        socket.on('invite-notice', async ({systemMessages}) => {
            setMessages((prev) => [...prev, systemMessages]);
        });

        return () => {
            socket.off('join-room');
            socket.off('leave-notice');
            socket.off('room-deleted');
            socket.off('update-deleted', handleDeletedMessage);
            socket.off('invite-notice');
            socket.off('send-message');
        };
            
    }, []);

    const objectIdToTimestamp = (objectId) => {
        const hexTimestamp = objectId.substring(0, 8);
        const timestamp = parseInt(hexTimestamp, 16) * 1000;
        return new Date(timestamp);
    }

    const handleLeave = async () => {
        try {
            if (adminId === memberId) {
                const res = await axios.get(`/chat/${roomId}/members`);
                if (res.data.members.length > 1) {
                    alert('퇴장 전 사용자 목록에서 관리자 권한을 위임해주세요.');
                    return;
                }
            }
            if (!window.confirm('채팅방 내역이 삭제됩니다. 퇴장하시겠습니까?')) return;
            const res = await axios.delete(`/chat/${roomId}/withdraw`);
            if (res.data.success){
                socket.emit('leave-room', {roomId});
                alert('퇴장 완료되었습니다.');
                navigate(`/chat/show/${memberId}`);
            }
        } catch (err) {
            console.error("채팅방 퇴장 실패: ", err);
            const errorCode = err?.response?.data?.code?.toString();
            const errorMessage = err?.response?.data?.message?.toString();

            if (errorCode) {
                setErrMessage(`${errorMessage}`);
                setShowErrorModal(true);
            } else {
                setErrMessage('채팅방 퇴장에 실패했습니다.');
                setShowErrorModal(true);
            }
        }
    }

    const handleSend = () => {
        if (input.trim() === '') return;

        //const newMessage = {text: input, from: 'user'};
        //setMessages([...messages, newMessage]);
        socket.emit('save-message', {roomId, message: input});
        setInput('');
    };

    const checkSender = (senderId, memberId) => {
        return senderId.toString() === memberId.toString();
    }

    const handleDelete = (roomId, messageId) => {
        socket.emit('delete-message', {roomId, messageId});
    }

    const handleSaveName = async () => {
        setShowNameModal(false);
        try {
            const res = await axios.patch(`/chat/${roomId}/change_name`, {
                newName: tempName,
            });

            if (res.data.success) {
                setRoomName(tempName);
                alert('이름 변경 완료');
                setShowNameModal(false);
            } else {
                alert('이름 변경 실패');
            }
        } catch (err) {
            const errorCode = err?.response?.data?.code?.toString();
            const errorMessage = err?.response?.data?.message?.toString();

            if (errorCode) {
                setErrMessage(`${errorMessage}`);
                setShowErrorModal(true);
            } else {
                setErrMessage('채팅방 이름 변경 오류');
                setShowErrorModal(true);
            }
        }
    };

    const handleDeleteRoom = async () => {
        try {
            await axios.delete(`/chat/${roomId}/delete`);

            navigate(`/chat/show/${memberId}`);
        } catch (err) {
            const errorCode = err?.response?.data?.code?.toString();
            const errorMessage = err?.response?.data?.message?.toString();

            if (errorCode) {
                switch (errorCode) {
                    case 'DB001':
                    case 'AUTH005':
                        setErrMessage(`${errorMessage}`);
                        setShowErrorModal(true);
                        navigate(`/chat/show/${memberId}`);
                        break;

                    default:
                        setErrMessage(`${errorMessage}`);
                        setShowErrorModal(true);
                        break;
                }
            } else {
                setErrMessage('채팅방 삭제에 실패했습니다.');
                setShowErrorModal(true);
            }
        }
    }

    if (isDeleted || canceledRef.current) return (
        <div className='flex items-center justify-center'
            style={{paddingTop: '100px'}}>
            <div className='text-center'>
                <div style={{paddingBottom:'30px', fontSize: '18px', fontWeight: '800'}}>
                    삭제된 채팅방입니다.
                </div>
                {memberId ? (
                    <button className='btn'
                        style={{fontSize:'13px', color:'white', backgroundColor: '#ff5500'}}
                        onClick={() => {navigate(`/chat/show/${memberId}`);}}>
                        채팅방 목록으로 이동
                    </button>
                ) : (
                    <button className='btn btn-warning'
                        style={{fontSize:'13px', color:'white', backgroundColor: '#ff5500'}}
                        onClick={() => navigate(`/`)}>
                        메인으로 이동
                    </button>
                )}
                
            </div>
        </div>
    );
    
    return (
        <Container style={{maxWidth:'600px', marginTop: '100px'}}>
            <Card style={{background: 'lemonchiffon'}}>
                <Card.Header>
                    <div style={{
                        display:'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <span>{roomName}</span>
                        </div>
                        <button
                            className="btn btn-warning"
                            style={{color: 'white', marginLeft: '20px'}}
                            onClick={() => setShowNameModal(true)}
                        >
                            이름 변경
                        </button>
                        <NameModal
                            show={showNameModal}
                            onClose={() => setShowNameModal(false)}
                            onSave={handleSaveName}
                            message={'이름 변경'}
                            value={tempName}
                            onChange={setTempName}
                        />
                        {isDeleted ? null : (
                            <SidePanel
                                socket={socket}
                                roomId={roomId}
                                isOpen={sidePanel}
                                setIsOpen={setSidePanel}
                                admin={adminId}
                                setAdmin={delegateAdmin}
                            />
                        )}
                    </div>
                    <div className="search-box">
                        <input type="text" placeholder="검색어를 입력하세요." ref={keywordRef}/>
                        <button
                            className="btn btn-warning"
                            style={{color: 'white', marginLeft: '12px'}}
                            onClick={() => searchSubmit()}
                        >
                            검색
                        </button>
                        {search.searchMode && (
                            <div style={{marginTop: '8px'}}>
                                <button
                                    className='btn btn-warning'
                                    style={{marginRight: '5px', padding: '3px', color: 'white'}}
                                    onClick={movePrev}
                                >
                                    ↓이전
                                </button>
                                <button
                                    className='btn btn-warning'
                                    style={{marginRight: '5px', padding: '3px', color: 'white'}}
                                    onClick={moveNext}
                                >
                                    ↑이후
                                </button>
                                <button
                                    className='btn btn-warning'
                                    style ={{padding: '3px', color: 'white'}}
                                    onClick={endSearchMode}
                                >
                                    검색 종료
                                </button>
                                {/*search.result.length > 0 && (
                                    <span>{search.index + 1} / {search.result.length}</span>
                                )*/}
                            </div>
                        )}
                    </div>
                </Card.Header>
                <Card.Body
                    ref={containerRef}
                    style={{height: '300px', overflowY: 'scroll', background: '#f8f9fa'}}>
                    {search.searchMode ? (
                        <ul>
                        {/*index를 순회하며 before, center, after 얻고 해당 값들 map으로 표시*/}
                            {merged.map((msg, index) => {
                                const currentDate = new Date(msg.time).toLocaleDateString('ko-KR', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                });

                                const prevMsg = messages[index - 1];
                                const prevDate = prevMsg ?
                                    new Date(prevMsg.time).toLocaleDateString('ko-KR', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                    }) : null;

                                const divideDate = currentDate !== prevDate;

                                return (
                                    <React.Fragment key={`search_frag: ${msg._id}:${index}`}>
                                        {divideDate && (
                                            <li style={{
                                                textAlign: 'center',
                                                margin: '12px 0',
                                                color: '#666',
                                                fontSize: '0.85rem',
                                                }}
                                                className='dot-removed'
                                            >
                                                {currentDate}
                                            </li>
                                        )}
                                        {(msg.system ?? false) ? (
                                            <li key={`content: ${msg._id}`}
                                                className='dot-removed'
                                                style={{
                                                    textAlign: 'center', backgroundColor: '#d5dbe3',
                                                    padding: '3px', margin: '5px 0px'
                                                }}
                                            >
                                                <div>{msg.content}</div>
                                            </li>
                                        ) : (checkSender(msg.sender._id, memberId) ? (
                                                <li key={`li: ${msg._id}`}
                                                    className='dot-removed'
                                                    style={{textAlign: 'right', margin: '10px 0px'}}>
                                                    <strong>{msg.sender.name}</strong>
                                                    <br/>
                                                    {selectedId === msg._id && !(msg.deleted) &&  (
                                                        <button className='small-btn'
                                                            style={{marginLeft: '8px'}}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(roomId, msg._id);
                                                            }}
                                                        >
                                                        삭제
                                                        </button>
                                                    )}
                                                    {msg.unread > 0 && (
                                                        <span className="unread"
                                                            style={{
                                                            margin: "8px",
                                                            opacity: 0.5
                                                        }}>{msg.unread}</span>
                                                    )}
                                                    <div key={msg._id} className={msg._id === centerId ? 'highlight': ''}
                                                        ref={msg._id === centerId ? centerRef : null}
                                                        style={{
                                                            display: 'inline-block',
                                                            padding: '8px 15px',
                                                            borderRadius: '16px',
                                                            backgroundColor: '#5d9b60ff',
                                                            color:'white',
                                                            maxWidth: '30%',
                                                            marginTop: '3px',
                                                        }}
                                                        onClick={() => setSelectedId(msg._id)}
                                                    >
                                                        {msg.deleted ? <div>삭제된 메시지입니다.</div> : <div>{msg.content}</div>}
                                                        
                                                        
                                                        <div style={{fontSize: '0.75rem', opacity: 0.7, marginTop: '4px'}}>
                                                            {new Date(msg.time).toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit'})}
                                                        </div>
                                                    </div>
                                                </li>
                                            ) : (
                                                <li key={`li: ${msg._id}`}
                                                    className='dot-removed'
                                                    style={{textAlign: 'left', margin: '10px 0px'}}>
                                                    <strong>{msg.sender.name}</strong>
                                                    <br/>
                                                    <div key={msg._id} className={msg._id === centerId ? 'highlight': ''}
                                                        ref={msg._id === centerId ? centerRef : null}
                                                        style={{
                                                            display: 'inline-block',
                                                            padding: '8px 15px',
                                                            borderRadius: '16px',
                                                            backgroundColor: '#e2e3e5',
                                                            color: 'black',
                                                            maxWidth: '30%',
                                                            marginTop: '3px',
                                                        }}
                                                        onClick={() => setSelectedId(msg._id)}
                                                    >
                                                        {msg.deleted ? <div>삭제된 메시지입니다.</div> : <div>{msg.content}</div>}
                                                        
                                                        <div style={{fontSize: '0.75rem', opacity: 0.7, marginTop: '4px'}}>
                                                            {new Date(msg.time).toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit'})}
                                                        </div>
                                                    </div>
                                                    {msg.unread > 0 && (
                                                        <span className="unread"
                                                            style={{
                                                            margin: "8px",
                                                            opacity: 0.5
                                                        }}>{msg.unread}</span>
                                                    )}
                                                </li>
                                            )
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </ul>
                    ):(
                        <div>
                            <ul>
                                {messages.map((msg, index) => {
                                    <div key={index}>{msg.content}</div>
                                    const currentDate = new Date(msg.time).toLocaleDateString('ko-KR', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                    });

                                    const prevMsg = messages[index - 1];
                                    const prevDate = prevMsg ?
                                        new Date(prevMsg.time).toLocaleDateString('ko-KR', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                        }) : null;

                                    const divideDate = currentDate !== prevDate;

                                    return (
                                        <React.Fragment key={`frag: ${msg._id}`}>
                                            {divideDate && (
                                                <li key={msg.time}
                                                    className='dot-removed'
                                                    style={{
                                                    textAlign: 'center',
                                                    margin: '12px 0',
                                                    color: '#666',
                                                    fontSize: '0.85rem',
                                                }}
                                                >
                                                    {currentDate}
                                                </li>
                                            )}
                                            {(msg.system ?? false) ? (
                                                <li key={`content: ${msg._id}`}
                                                    className='dot-removed'
                                                    style={{
                                                        textAlign: 'center', backgroundColor: '#d5dbe3',
                                                        padding: '3px', margin: '5px 0px'
                                                    }}
                                                >
                                                    <div>{msg.content}</div>
                                                </li>
                                            ) : (checkSender(msg.sender._id, memberId) ? (
                                                <li key={`li: ${msg._id}`}
                                                    className={'dot-removed'}
                                                    style={{
                                                        textAlign: 'right',
                                                        marginTop: '10px',
                                                        marginBottom: '10px'
                                                    }}>
                                                    <strong>{msg.sender.name}</strong>
                                                    <br/>
                                                    {selectedId === msg._id && !(msg.deleted) &&  (
                                                        <button className='small-btn'
                                                            style={{marginLeft: '8px'}}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (checkSender(msg.sender._id, memberId)) {
                                                                    handleDelete(roomId, msg._id);
                                                                }
                                                            }}
                                                        >
                                                        삭제
                                                        </button>
                                                    )}
                                                    {msg.unread > 0 && (
                                                        <span className="unread"
                                                            style={{
                                                            margin: "8px",
                                                            opacity: 0.5
                                                        }}>{msg.unread}</span>
                                                    )}
                                                    <div key={msg._id}
                                                        ref={msg._id === messages[messages.length - 1]._id ? lastMsgRef : null}
                                                        style={{
                                                            display: 'inline-block',
                                                            padding: '8px 15px',
                                                            borderRadius: '16px',
                                                            backgroundColor: '#5d9b60ff',
                                                            color: 'white',
                                                            maxWidth: '30%',
                                                            marginTop: '3px',
                                                        }}
                                                        onClick={() => setSelectedId(msg._id)}
                                                    >
                                                        {msg.deleted ? <div>삭제된 메시지입니다.</div> : <div>{msg.content}</div>}
                                                        
                                                        
                                                        <div style={{fontSize: '0.75rem', opacity: 0.7, marginTop: '4px'}}>
                                                            {new Date(msg.time).toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit'})}
                                                        </div>
                                                    </div>
                                                </li>
                                            ):(
                                                <li key={`li: ${msg._id}`}
                                                    className={'dot-removed'}
                                                    style={{
                                                        textAlign: 'left',
                                                        marginTop: '10px',
                                                        marginBottom: '10px'
                                                    }}>
                                                    <strong>{msg.sender.name}</strong>
                                                    <br/>
                                                    <div key={msg._id}
                                                        ref={msg._id === messages[messages.length - 1]._id ? lastMsgRef : null}
                                                        style={{
                                                            display: 'inline-block',
                                                            padding: '8px 15px',
                                                            borderRadius: '16px',
                                                            backgroundColor: '#e2e3e5',
                                                            color: 'black',
                                                            maxWidth: '30%',
                                                            marginTop: '3px',
                                                        }}
                                                        onClick={() => setSelectedId(msg._id)}
                                                    >
                                                        {msg.deleted ? <div>삭제된 메시지입니다.</div> : <div>{msg.content}</div>}
                                                        
                                                        <div style={{fontSize: '0.75rem', opacity: 0.7, marginTop: '4px'}}>
                                                            {new Date(msg.time).toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit'})}
                                                        </div>
                                                    </div>
                                                    {msg.unread > 0 && (
                                                        <span className="unread"
                                                            style={{
                                                            margin: "8px",
                                                            opacity: 0.5
                                                        }}>{msg.unread}</span>
                                                    )}
                                                </li>
                                            ))}
                                        </React.Fragment>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </Card.Body>
                <Card.Footer>
                    <div>
                        {newPreview && (
                            <div className='new-message-badge'
                                onClick={scrollToBottom}
                            >
                                새 메시지: {newPreview}
                            </div>
                        )}
                        <Form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSend();
                            }}
                        >
                            <Row style={{display:"flex", alignItems:"center"}}>
                                <Form.Control
                                    type='text'
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    style={{flex:1, marginRight: '12px', marginLeft: '5px'}}
                                    placeholder='메시지를 입력하세요.'
                                />
                                <Button variant='primary' type='submit'
                                    className="btn btn-warning"
                                    style={{width:'15%', color: 'white', marginLeft: '5px', marginRight: '5px'}}
                                >
                                    전송
                                </Button>
                            </Row>
                        </Form>
                    </div>
                </Card.Footer>
            </Card>
            <div
                style={{
                    bottom: '20px',
                    width: '100%',
                    backgroundColor: '#fff',
                    borderTop: '1px solid #ccc',
                    padding: '30px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    zIndex: 50,
                }}
            >
                <button className='btn btn-warning'
                    onClick={() => navigate(`/invite/${roomId}`)}>
                    초대
                </button>
                <button className='btn btn-warning'
                    onClick={handleLeave}>
                    퇴장
                </button>
                {adminId === memberId &&
                    <button className='btn btn-warning'
                        style={{color:'white', backgroundColor:'#ff8388', border: '#ff8388'}}
                        onClick={handleDeleteRoom}>
                        채팅방 삭제
                    </button>}
            </div>
            {showErrorModal && (
                <MessageModal
                    message={errMessage}
                    show={showErrorModal}
                    onClose={() => setShowErrorModal(false)}
                />
            )}
        </Container>
    );
}
import {useState, useEffect} from 'react';
import {axiosInstance as axios} from '../api/axiosInstance';
import MessageModal from '../components/MessageModal';

export default function MemberSearch() {
    const [query, setQuery] = useState(''); // 입력칸의 값
    const [searchQuery, setSearchQuery] = useState(''); // 입력칸에서 실제 실행에 쓰는 값
    const [members, setMembers] = useState([]);
    const [sent, setSent] = useState([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [total, setTotal] = useState(0);
    const [sortOrder, setSortOrder] = useState('asc');
    const limit = 10;
    
    const [errMessage, setErrMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);

    async function fetchMembers() {
        try {
            if (!query) {
                alert('검색어를 입력해주세요.');
                return;
            }
            const memberRes = await axios.get('/friend/search',
                {params: {
                    name: query,
                    page,
                    limit,
                    sortOrder
                    }
                },
            );
            
            if (memberRes.data.success) {
                setMembers(memberRes.data.members);
                setHasMore(memberRes.data.hasMore);
                setTotal(memberRes.data.total);
            } else {
                setMembers([]);
                setHasMore(false);
                setTotal(0);
            }
            
            const sentRes = await axios.get('/friend/sent');

            if (sentRes.data.success) {
                setSent(sentRes.data.requests.map((r) => r._id));
            }

        } catch (err) {
            const errorCode = err?.response?.data?.code?.toString();
            const errorMessage = err?.response?.data?.message?.toString();

            if (errorCode) {
                setErrMessage(`${errorMessage}`);
                setShowErrorModal(true);
            } else {
                setErrMessage('사용자 검색에 오류가 발생했습니다.');
                setShowErrorModal(true);
            }
        }
    }

    useEffect(() => {
        if (!query) return;

        fetchMembers();
    }, [page, sortOrder, searchQuery]);

    const totalPages = Math.ceil(total/limit); // 필요한 페이지수

    const startPage = Math.floor(page/10) * 10; // 10 구간 중 어느 시작점인지(1, 11, 21...)
    const endPage = Math.min(startPage + 9, totalPages - 1); // 마지막 부분(인덱스값 일치시키기 위해 -1)

    const sendFriendRequest = async (receiver) => {
        try {
            const res = await axios.post('/friend/send/request',
                {receiver: receiver},
            );

            if (res.data.success) {
                setSent((prev) => [...prev, receiver]);
            }
        } catch (err) {
            console.error('친구 요청 오류: ', err);
        }
    }

    return (
        <div style={{display: 'flex', alignItems: 'center', flexDirection: 'column', padding: '30px 200px'}}>
            <div style={{display: 'flex', alignItems: 'center'}}>
                <div style={{display: 'flex', alignItems: 'center'}}>
                    <input type="text"
                        placeholder="이름"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setPage(0);
                        }}
                    />
                    <button className='btn btn-warning'
                        style={{color: 'white', padding: '3px 4px 3px 4px'}}
                        onClick={() => setSearchQuery(query)}
                    >
                        검색
                    </button>
                </div>
                <div style={{marginLeft:'30px'}}>
                    <button style={{backgroundColor: 'white', borderRadius: '10px', fontWeight: '500',
                        fontSize: '16px', borderWidth: 'thin'}}
                        onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}>
                        정렬: {sortOrder === 'asc' ? '오름차순' : '내림차순'}
                    </button>
                </div>
            </div>

            
            <div style={{padding: '50px 0px'}}>
                <ul className='dot-removed'>
                    {members.length > 0 ? (members.map((m) => (
                        <li key={m._id}
                            style={{minHeight: '40px'}}
                        >
                            {m.name} {' '} {m.isFriend ? (
                                <span style={{paddingLeft: "10px"}}>(친구)</span>
                            ) : sent.includes(m._id) ? (
                                <span style={{paddingLeft: "10px"}}>(요청 발송)</span>
                            ) : m.isRequested ? (
                                <span style={{paddingLeft: "10px"}}>(요청 대기)</span>
                            ) : (
                                <button style={{borderRadius: '10px', backgroundColor: 'white', borderWidth: 'thin', margin: '9px 0px 0px 10px'}}
                                    onClick={() => {
                                    sendFriendRequest(m._id);
                                }}>
                                    친구 요청
                                </button>
                            )}
                        </li>
                        ))
                    ) : (query.length < 0 ? (
                            <p>검색어를 입력해주세요.</p>
                        ) : (
                            <p>조건에 맞는 친구를 찾을 수 없습니다.</p>
                        )
                    )
                    }
                </ul>
            </div>

            <div>
                <button className='page-btn'
                    onClick={() => setPage((p) => Math.max(p - 1, 0))}
                    disabled={page === 0}
                > 이전 </button>

                {startPage > 0 && (
                    <button className='page-btn' onClick={() => setPage(startPage - 1)}>«</button>
                )}

                {Array.from({length: endPage - startPage + 1}, (_, i) => {
                    const pageNum = startPage + i;
                    return (
                        <button key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className='page-btn'
                            disabled={page === pageNum}
                            style={{fontWeight: page === pageNum ? 'bold' : 'normal',
                                margin: '0 3px',
                            }}
                        >
                            {pageNum + 1}
                        </button>
                    );
                })}

                {endPage < totalPages - 1 && (
                    <button className='page-btn' onClick={() => setPage(endPage + 1)}>»</button>
                )}

                <button className='page-btn'
                    onClick={() => setPage((p) => (hasMore ? p + 1 : p))}
                    disabled={(!hasMore || page + 1 === totalPages)}
                > 다음 </button>
            </div>
            {showErrorModal && (
                <MessageModal
                    message={errMessage}
                    show={showErrorModal}
                    onClose={() => setShowErrorModal(false)}
                />
            )}
        </div>
    );
}
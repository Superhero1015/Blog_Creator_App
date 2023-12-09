const PostList = ({ list, remove }) => {
    return (
        <>
            {list?.length > 0 ? (
                <ul className="post-list">
                    {list.map((entry, index) => (
                        <div className="post">
                            <li key={index}> {entry} </li>

                            <button
                                className="delete-button"
                                onClick={() => {
                                    remove(entry);
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                </ul>
            )   :   (
                 <div className="empty">
                    <p>No post found</p>
                </div>
            )}
        </>
    );
};

export default PostList;

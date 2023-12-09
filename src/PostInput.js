const PostInput = ({ post, setPost, addPost }) => {
    return (
        <div className="input-wrapper">
            <input
                type="text"
                name="post"
                value={post}
                placeholder="Create a new post"
                onChange={(e) => {
                    setPost(e.target.value);
                }}
            />
            <button className="add-button" onClick={addPost}>
                Add
            </button>
        </div>
    );
};


export default PostInput;
(async () => {
    // Fetch manifest
    const res = await fetch('posts/manifest.json');
    if (!res.ok) {
        document.getElementById('latest-post').innerHTML = '<p class="loading">暂无早报内容</p>';
        return;
    }
    const manifest = await res.json();
    const latest = manifest.posts[0];

    // Load latest post content
    const postRes = await fetch(`posts/${latest.file}`);
    const html = await postRes.text();
    document.getElementById('latest-post').innerHTML = html;

    // Build archive
    const archiveList = document.getElementById('archive-list');
    manifest.posts.slice(1).forEach(post => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="posts/${post.file}">${post.date} ${post.weekday}</a>`;
        archiveList.appendChild(li);
    });
})();

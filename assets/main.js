(async () => {
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
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract post body and insert
    const postBody = doc.querySelector('.post-body');
    if (postBody) {
        document.getElementById('latest-post').innerHTML = postBody.innerHTML;
    } else {
        // Fallback: use the whole body content minus header/sidebar
        document.getElementById('latest-post').innerHTML = html;
    }

    // Build TOC from loaded content
    const tocList = document.getElementById('toc-list');
    const sections = postBody ? postBody.querySelectorAll('.section-card') : [];
    sections.forEach(sec => {
        const id = sec.id;
        const titleEl = sec.querySelector('.section-title');
        if (id && titleEl) {
            const li = document.createElement('li');
            li.className = 'toc-item';
            li.innerHTML = `<a href="#${id}">${titleEl.textContent.trim()}</a>`;
            tocList.appendChild(li);
        }
    });

    // Build archive
    const archiveList = document.getElementById('archive-list');
    manifest.posts.slice(1).forEach(post => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="posts/${post.file}">${post.date}<span class="weekday">${post.weekday}</span></a>`;
        archiveList.appendChild(li);
    });
})();

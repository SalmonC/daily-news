(function () {
    "use strict";

    function initReadingProgress() {
        var bar = document.getElementById("reading-progress");
        if (!bar) {
            bar = document.createElement("div");
            bar.id = "reading-progress";
            bar.className = "reading-progress";
            bar.setAttribute("aria-hidden", "true");
            document.body.prepend(bar);
        }

        function update() {
            var scrollable = document.documentElement.scrollHeight - window.innerHeight;
            var progress = scrollable > 0 ? Math.min(100, (window.scrollY / scrollable) * 100) : 0;
            bar.style.width = progress + "%";
        }

        update();
        window.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", update, { passive: true });
    }

    function initBackToTop() {
        var button = document.getElementById("back-to-top");
        if (!button) {
            button = document.createElement("button");
            button.id = "back-to-top";
            button.className = "back-to-top";
            button.type = "button";
            button.setAttribute("aria-label", "回到顶部");
            button.textContent = "↑";
            document.body.appendChild(button);
        }

        function update() {
            button.classList.toggle("is-visible", window.scrollY > 560);
        }

        button.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
        update();
        window.addEventListener("scroll", update, { passive: true });
    }

    function initPagination() {
        document.querySelectorAll(".archive-paginated").forEach(function (container) {
            var items = Array.from(container.querySelectorAll(".archive-item"));
            var pageSize = parseInt(container.dataset.pageSize, 10) || 10;
            var button = document.querySelector('[data-load-more="' + container.id + '"]') ||
                document.getElementById(container.id + "-more") ||
                document.getElementById(container.id.replace("-archive", "") + "-more");

            if (!button || items.length <= pageSize) {
                if (button) button.classList.add("hidden");
                return;
            }

            items.forEach(function (item, index) {
                if (index >= pageSize) item.hidden = true;
            });
            button.classList.remove("hidden");

            button.addEventListener("click", function () {
                var firstHidden = items.findIndex(function (item) { return item.hidden; });
                if (firstHidden < 0) return;
                items.slice(firstHidden, firstHidden + pageSize).forEach(function (item) {
                    item.hidden = false;
                });
                if (!items.some(function (item) { return item.hidden; })) {
                    button.classList.add("hidden");
                }
            });
        });
    }

    function initActiveToc() {
        var links = Array.from(document.querySelectorAll(".toc-item a[href^='#']"));
        if (!links.length || !("IntersectionObserver" in window)) return;

        var linkById = new Map();
        links.forEach(function (link) {
            linkById.set(link.getAttribute("href").slice(1), link);
        });

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                links.forEach(function (link) { link.classList.remove("is-active"); });
                var active = linkById.get(entry.target.id);
                if (active) active.classList.add("is-active");
            });
        }, { rootMargin: "-15% 0px -70% 0px", threshold: 0 });

        linkById.forEach(function (_, id) {
            var section = document.getElementById(id);
            if (section) observer.observe(section);
        });
    }

    function hardenExternalLinks(root) {
        (root || document).querySelectorAll('a[target="_blank"]').forEach(function (link) {
            link.setAttribute("rel", "noopener noreferrer");
        });
    }

    async function loadHomeContent() {
        var latestContainer = document.getElementById("latest-post");
        var archiveList = document.getElementById("archive-list");
        if (!latestContainer || !archiveList) return;

        try {
            var response = await fetch("posts/manifest.json");
            if (!response.ok) throw new Error("manifest unavailable");
            var manifest = await response.json();
            var latest = manifest.posts && manifest.posts[0];
            if (!latest) throw new Error("no posts");

            var headerDate = document.getElementById("header-date");
            if (headerDate) {
                headerDate.dateTime = latest.date;
                headerDate.textContent = latest.date;
            }

            var postResponse = await fetch("posts/" + latest.file);
            if (!postResponse.ok) throw new Error("latest post unavailable");
            var html = await postResponse.text();
            var doc = new DOMParser().parseFromString(html, "text/html");
            var postBody = doc.querySelector(".post-body");

            if (!postBody) throw new Error("post body missing");
            var hiddenPostHero = postBody.querySelector(".hero-date");
            if (hiddenPostHero) hiddenPostHero.remove();
            latestContainer.innerHTML = postBody.innerHTML;
            hardenExternalLinks(latestContainer);

            manifest.posts.slice(1, 25).forEach(function (post) {
                var item = document.createElement("li");
                var link = document.createElement("a");
                var weekday = document.createElement("span");
                link.href = "posts/" + post.file;
                link.append(document.createTextNode(post.date));
                weekday.className = "weekday";
                weekday.textContent = post.weekday;
                link.appendChild(weekday);
                item.appendChild(link);
                archiveList.appendChild(item);
            });
        } catch (error) {
            latestContainer.innerHTML = '<p class="loading">Doro 翻了翻口袋，暂时没找到最新日报。</p>';
            console.warn("Doro daily load failed:", error);
        }
    }

    document.addEventListener("DOMContentLoaded", async function () {
        initReadingProgress();
        initBackToTop();
        initPagination();
        initActiveToc();
        hardenExternalLinks(document);
        await loadHomeContent();
    });
})();

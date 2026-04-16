#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
将生成的 HTML 早报推送到 GitHub Pages 仓库
"""
import os
import sys
import json
import subprocess
import shutil
from datetime import datetime, timezone, timedelta

SITE_DIR = os.path.expanduser("~/Projects/daily-news-site")
REPO_URL = "git@github.com:salmonc/daily-news.git"

def run(cmd, cwd=SITE_DIR, check=True):
    result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if check and result.returncode != 0:
        print(f"Error running {' '.join(cmd)}:\n{result.stderr}", file=sys.stderr)
        sys.exit(1)
    return result

def deploy():
    os.chdir(SITE_DIR)
    
    # 确保是 git 仓库
    if not os.path.isdir(".git"):
        print("初始化 git 仓库...")
        run(["git", "init"])
        run(["git", "remote", "add", "origin", REPO_URL])
        run(["git", "branch", "-M", "main"])
    
    # 更新 manifest
    posts_dir = os.path.join(SITE_DIR, "posts")
    files = sorted([f for f in os.listdir(posts_dir) if f.endswith(".html") and f != "template.html"], reverse=True)
    manifest = {"posts": []}
    for f in files:
        date_str = f.replace(".html", "")
        try:
            dt = datetime.strptime(date_str, "%Y-%m-%d")
            weekday = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"][dt.weekday()]
            manifest["posts"].append({"file": f, "date": date_str, "weekday": weekday})
        except Exception:
            continue
    
    with open(os.path.join(posts_dir, "manifest.json"), "w", encoding="utf-8") as mf:
        json.dump(manifest, mf, ensure_ascii=False, indent=2)
    
    # 提交并推送
    run(["git", "add", "."])
    today = datetime.now(timezone(timedelta(hours=8))).strftime("%Y-%m-%d")
    result = run(["git", "diff", "--cached", "--quiet"], check=False)
    if result.returncode == 0:
        print("没有变更，跳过推送")
        return
    
    run(["git", "commit", "-m", f"update daily news {today}"])
    run(["git", "push", "origin", "main"])
    print(f"推送成功: {REPO_URL}")

if __name__ == "__main__":
    deploy()

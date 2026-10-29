#!/bin/bash
# Build AgentRogue test fork on local disk (/tmp) and push to GitHub Pages repo.
set -e
LOG=/workspace/work/pkr/deploy.log
exec > >(tee -a $LOG) 2>&1
echo "== start $(date)"
SRC=/workspace/work/pkr/repo
W=/home/sandbox/pk
if true; then
  mkdir -p $W; find $W -mindepth 1 -maxdepth 1 ! -name assets ! -name dist ! -name node_modules ! -name ".assets_ok" -exec rm -rf {} +
  (cd $SRC && tar --exclude=./.git --exclude=./assets --exclude=./node_modules --exclude=./dist -cf - .) | (cd $W && tar xf -)
  touch $W/.src_ok; echo "src copied $(date)"
fi
if [ ! -f $W/.assets_ok ]; then
  rm -rf $W/assets
  git clone -q --depth 1 https://github.com/pagefaultgames/pokerogue-assets.git $W/assets
  (cd $W/assets && git fetch -q --depth 1 origin 8250b23677d4918801fc6fc1e95b6dd1c30ef6c4 && git checkout -q 8250b23677d4918801fc6fc1e95b6dd1c30ef6c4) || echo "pin fetch failed, using default branch head"
  rm -rf $W/assets/.git
  touch $W/.assets_ok; echo "assets cloned $(date)"
fi
cd $W
[ -e node_modules ] || ln -s $SRC/node_modules node_modules
if true; then
  rm -rf dist
  npx vite build --mode agent > $W/../pkbuild.log 2>&1 || { tail -30 $W/../pkbuild.log; exit 1; }
  touch dist/.nojekyll
  cp /workspace/work/pkr/leaderboard.html dist/leaderboard.html
  touch $W/.built_ok; echo "built $(date)"
fi
cd dist
if [ ! -d .git ]; then
  git init -q -b main
  git add -A
  git -c user.name=miluan1995 -c user.email=267659602+miluan1995@users.noreply.github.com commit -qm "AgentRogue test build: PokeRogue fork with Agent ID gate (AGPL-3.0)"
  git remote add origin https://github.com/miluan1995/agentrogue-test.git
fi
git -c http.postBuffer=524288000 push -u origin main --force
echo "== pushed $(date)"

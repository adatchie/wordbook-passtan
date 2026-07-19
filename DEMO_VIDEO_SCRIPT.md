# デモ動画台本

想定尺: 約2分30秒。

おすすめ形式: アプリ画面の録画のみ。顔出しは不要。

日本語でナレーションを読み、英語字幕を動画またはYouTube説明欄に入れる想定。

## 撮影前の準備

1. ブラウザで `https://adatchie.github.io/wordbook/` を開く。
2. 可能ならiPadやタッチ画面で撮る。無理ならPCのマウス操作でよい。
3. 音声を録る前に、OCRが読みやすい単語で一度練習する。
4. 最初のOCRではモデル読み込みに時間がかかるので、事前に一度「できた！」を押してモデルを読み込ませておくと録画が安定する。
5. 保護者画面を見せるため、手動正解を1件作っておくとよい。

## 撮る画面の順番

1. トップ画面を映す。
2. `Lv1 開始` を押す。
3. 表示された英単語を、下の手書き欄に書く。
4. `できた！（OCRで判定）` を押す。
5. 正解した場合、読み上げと次の問題への遷移を見せる。
6. OCRが間違えた場合は、`書き直す` または `手動正解` を見せればOK。
7. メニューに戻って、`Lv2 開始` を押し、歯抜け単語の画面を数秒見せる。
8. メニューに戻って、`Lv3 開始` を押し、意味と文字数だけの画面を数秒見せる。
9. セッション画面のタイマー部分を見せる。
10. `手動正解` を押し、OCR失敗時の救済があることを見せる。
11. メニューから `保護者` を押す。
12. PIN `0000` を入力して、手動正解の監査記録を見せる。
13. 最後にGitHubのREADME、または公開URLを映して終わる。

## 台本

### 0:00-0:20 - 問題提起

映す画面:

トップ画面。`Lv1 開始`、`Lv2 開始`、`Lv3 開始` のボタンが見える状態。

日本語ナレーション:

これは、日本の中学生向けの英単語練習アプリ、Wordbookです。
単語帳を眺めるだけでは英単語を覚えにくい生徒のために、手で何度も書いて覚える練習体験を作りました。

英語字幕:

This is Wordbook, a handwriting-first English vocabulary practice app for Japanese junior high school students.
It is designed for students who struggle to memorize words by only looking at a vocabulary book.

### 0:20-0:55 - 基本の練習ループ

映す画面:

`Lv1 開始` を押す。
出てきた単語を下の手書き欄に書く。
`できた！（OCRで判定）` を押す。
正解なら、単語が読み上げられて次の問題に進むところまで見せる。

OCRが間違えた場合:

無理に撮り直さなくてもよい。
不正解表示、`書き直す`、`手動正解` が見えれば、このアプリの挙動説明として使える。

日本語ナレーション:

画面には英単語と日本語の意味が表示されます。
生徒は下のスペースに単語を手書きします。
書き終わったらOCRで判定し、正解なら単語を読み上げて、すぐ次の問題に進みます。

英語字幕:

The app shows an English word and its Japanese meaning.
The student writes the word by hand in the space below.
When they submit it, OCR checks the handwriting. If the answer is correct, the app speaks the word and immediately moves to the next question.

### 0:55-1:25 - 3つの難易度

映す画面:

メニューへ戻り、`Lv2 開始` を押して、文字が一部隠れた単語を見せる。
次にメニューへ戻り、`Lv3 開始` を押して、英単語が隠れている画面を見せる。

きれいに撮るコツ:

Lv2とLv3では、手書きまでしなくてもよい。
それぞれの出題画面を2〜3秒ずつ見せれば十分。

日本語ナレーション:

難易度は3つあります。
レベル1は、表示された単語をそのまま書き写します。
レベル2は、半分くらい隠れた単語を、日本語の意味をヒントに補完します。
レベル3は、単語が完全に隠れていて、日本語の意味と文字数だけを頼りに書きます。

英語字幕:

There are three difficulty levels.
Level 1 asks the student to copy the visible word.
Level 2 hides about half of the letters, so the student must complete the word using the Japanese meaning as a clue.
Level 3 hides the whole word, leaving only the meaning and character count.

### 1:25-1:50 - タイマーと反復

映す画面:

セッション画面の上部にあるタイマーを見せる。
余裕があれば、時間切れまで待ってタイムアウト表示を見せる。
時間がもったいなければ、設定画面の制限時間設定を見せてもよい。

日本語ナレーション:

だらだら進めないように、各問題にはタイマーがあります。
時間切れになると正答数が減り、クリアに必要なノルマが増えます。
つまり、覚えるまで書くことを前提にした設計です。

英語字幕:

Each question has a timer to keep practice focused.
When time runs out, the net correct count goes down and the required target goes up.
The experience is designed around repeated written production until the student can actually spell the word.

### 1:50-2:15 - OCR失敗時の救済と保護者確認

映す画面:

セッション画面で `手動正解` を押す。
メニューに戻り、`保護者` を押す。
PIN入力欄に `0000` を入れて開く。
手動正解の記録に、単語・意味・手書き画像が残っているところを見せる。

日本語ナレーション:

ブラウザのOCRは完璧ではないので、手動正解ボタンも用意しています。
ただし、手動正解を使った場合は、問題と手書き画像が保存されます。
あとで保護者が確認できるので、OCRの失敗に対応しつつ、不正利用も見つけやすくしています。

英語字幕:

Browser OCR is not perfect, so the app includes a manual pass button.
But when manual pass is used, the app saves the prompt and handwriting image.
A parent can review those records later, so the app can handle OCR failures without making the escape hatch invisible.

### 2:15-2:40 - CodexとGPT-5.6の使い方

映す画面:

GitHubリポジトリ、README、または公開URLを見せる。
READMEの `Build Week Notes` あたりが映ると、審査員に伝わりやすい。

日本語ナレーション:

CodexとGPT-5.6は、最初の仕様整理、Web版とiPad版の技術判断、プロトタイプの実装確認、OCRエラーの原因調査、Transformers.jsへの修正、GitHub Pagesへのデプロイに使いました。
Build Weekの短い期間で、アイデアを動くプロトタイプまで持っていけました。

英語字幕:

I used Codex and GPT-5.6 to turn the idea into a specification, compare web and iPad-native approaches, inspect the prototype, debug the OCR error, fix the Transformers.js input handling, and deploy the app to GitHub Pages.
Within Build Week, they helped move the project from an idea to a working prototype.

### 2:40-2:55 - 今後の予定

映す画面:

アプリのトップ画面に戻る。
またはGitHub PagesのURLが見える状態で終わる。

日本語ナレーション:

今後は、iPadネイティブアプリとして作り直し、Apple PencilとApple Vision OCRで、より自然な手書き練習アプリにしていく予定です。

英語字幕:

Next, I plan to rebuild this as a native iPad app using Apple Pencil input and Apple Vision OCR, so the handwriting practice can feel more natural and reliable.

## YouTube説明欄ドラフト

Wordbook is a handwriting-first English vocabulary practice app for Japanese junior high school students.

Live demo: https://adatchie.github.io/wordbook/
GitHub: https://github.com/adatchie/wordbook

This Build Week prototype uses browser handwriting input, OCR with Transformers.js and TrOCR, text-to-speech, timed sessions, three difficulty levels, score history, and parent-reviewable manual-pass audit records.

I used Codex and GPT-5.6 to define the product specification, compare implementation options, debug the OCR pipeline, fix the Transformers.js input error, verify the prototype, deploy it to GitHub Pages, and prepare the submission materials.

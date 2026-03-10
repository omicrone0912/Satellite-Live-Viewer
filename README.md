# QZSS Viewer (Michibiki Real-time Tracker)

日本の準天頂衛星システム「みちびき（QZSS: Quasi-Zenith Satellite System）」の現在の位置・高度・速度を、Webブラウザ上の地図にリアルタイムで可視化する簡易的なアプリケーションです。

---

## 機能・特徴

*   **リアルタイムトラッキング**: みちびき各号機（1R号機, 2号機, 3号機, 4号機, 6号機）の現在位置を地図上にプロットし、1秒ごとにアニメーションを更新します。
*   **軌跡表示**: 過去18時間分の衛星の軌跡を地図上にプロットし、みちびきの軌道を視覚化できます。
*   **詳細データの表示**: パネル上で各衛星の現在の「高度 (Altitude)」と「速度 (Velocity)」をリアルタイムで確認できます。
*   **オフライン/API障害フォールバック**: CelesTrak APIへのアクセスが遮断されたり、サーバーダウンした場合でも、内部に組み込まれたデータに自動で補完してくれます。

---

## 主要技術

*   **フロントエンド言語**
    *   HTML5
    *   CSS3
    *   TypeScript
*   **ビルドツール**
    *   Vite (Vanilla-TS テンプレート)
*   **地図ライブラリ**
    *   Leaflet.js
*   **軌道計算ライブラリ**
    *   satellite.js (SGP4/SDP4 軌道伝搬)
*   **利用データ / API**
    *   [CelesTrak](https://celestrak.org/) (TLEデータ取得元)
    *   [OpenStreetMap](https://www.openstreetmap.org/) (マップタイル取得元)

---

## Webサーバー (FTP) へのアップロード・公開手順

このプロジェクトは、Xserver、さくらのレンタルサーバなどの一般的なWebサーバーにFTPでアップロードして公開することができます。

サンプルページは[こちら](https://omicrone.dev/qzss/)で公開中です。

### 1. 本番用ファイルのビルド
まず、プロジェクトフォルダで以下のコマンドを実行し、最適化されたファイルを生成します。

```bash
npm run build
```

コマンドの実行が完了すると、プロジェクト内に新しく **`dist`** というフォルダが作成されます。この中のファイル群がWebサーバーにアップロードする対象となります。

### 2. FTPクライアントを使ったアップロード
FFFTPやWinSCPなどのFTPソフトを使用して、サーバーへファイルを転送します。

1. FTPソフトを起動し、ご自身のWebサーバーに接続します。（ホスト名、ユーザー名、パスワード等はサーバーの契約情報をご確認ください）
2. サーバー側の **公開ディレクトリ** （`public_html` や `www` など）を開きます。
3. ローカル側で、先ほど作成された **`dist`** フォルダを開きます。
4. **`dist` フォルダの中にあるすべてのファイルとフォルダ**（`index.html` や `assets` フォルダなど）を選択し、サーバーの公開ディレクトリへアップロードします。

> [!NOTE]
> `dist` フォルダ自体をアップロードするのではなく、**フォルダの中身**をアップロードしてください。

※ URLの設定（`vite.config.ts` の `base`）は相対パス(`./`)になっているため、サブディレクトリにアップロードした場合でもそのまま動作します。

---

# QZSS Viewer (Michibiki Real-time Tracker)

It is a simple application that visualises the current position(Latitude,Longitude), altitude, and speed of Michibiki, the Japan's Quasi-Zenith Satellite System (QZSS) in real time on a map online web browser.

---

## Specifications and Features

* **Real-time tracking**: The current position of each Michibiki satellite (# 1R, # 2, # 3, # 4 and # 6) is plotted on a map with animation updated every second.
* **Orbit display**: Plot the satellite's orbit for the past 18 hours on a map to visualise the Michibiki orbit.
* **Detailed data display**: Check the current "Altitude" and "Velocity" of each satellite in real time on the panel.
* **Offline/API failure fallback**: Even if access to the CelesTrak API is interrupted or the server goes down, the data will automatically be filled in using the built-in data.

---

## Technical specifications

*   **Front-end Language**
    *   HTML5
    *   CSS3
    *   TypeScript
*   **Build Tool**
    *   Vite (Vanilla-TS Templates)
*   **Map Libraries**
    *   Leaflet.js
*   **Orbit Calculation Library**
    *   satellite.js (SGP4/SDP4 Orbit Propagation)
*   **Usage Data / API**
    *   [CelesTrak](https://celestrak.org/) (TLE Data Source API)
    *   [OpenStreetMap](https://www.openstreetmap.org/) (Map Tile Source)
  
---

## Deployment to Web Server (via FTP)

This project can be easily deployed to standard web servers (such as Apache, Nginx, or shared hosting services) by simply uploading the files via FTP.

A sample page is [here](https://omicrone.dev/qzss/).

### 1. Build the production files
First, run the following command in your project directory to generate the optimized files.

```bash
npm run build
```

Once the command finishes executing, a new folder named **`dist`** will be created in your project directory. The files inside this folder are the ones you will upload to your web server.

### 2. Upload using an FTP client
Use an FTP client like FileZilla or Cyberduck to transfer the files to your server.

1. Open your FTP client and connect to your web server (check your server hosting provider for hostname, username, and password).
2. Navigate to the **public directory** on your server (often named `public_html`, `www`, or `htdocs`).
3. On your local machine, open the newly created **`dist`** folder.
4. Select **all files and folders inside the `dist` folder** (such as `index.html` and the `assets` folder) and upload them to your server's public directory.

> [!NOTE]
> Ensure you upload the **contents of the folder**, not the `dist` folder itself.

*Note: The URL configuration (`base` in `vite.config.ts`) is set to use relative paths (`./`), so the application will work perfectly fine even if you upload it to a subdirectory.*

---
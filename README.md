# rii_3112

ポートフォリオサイトです。Next.js の静的エクスポートで出力します。

## 要件

- Node.js 26 以上（`package.json` の `engines`）

## 開発

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開きます。

## スクリプト

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバー |
| `npm run build` | 静的ファイルを `out/` に出力 |
| `npm run start` | ビルド結果を配信 |
| `npm run check` | Biome でリントとフォーマットを確認 |
| `npm run check:fix` | Biome の指摘を自動修正 |

## スタック

- Next.js 16
- React 19
- Tailwind CSS 4
- three.js
- TypeScript 5.9
- Biome

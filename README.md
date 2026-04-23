# 猫语翻译器

一个部署到 GitHub Pages 的静态单页网站，实现可逆猫语协议 `nya58-zh2`。

## 特性

- 任意 Unicode 文本 `-> UTF-8 -> frame -> base58 digit -> 58-token 猫语`
- `raw` 与 `zstd-dict` 双 codec，编码时自动选择更短 payload
- 浏览器本地编解码，无服务端依赖
- 主线程 UI + Web Worker 协议内核，避免压缩和 wasm 初始化卡住页面
- 中文主文案、简化版猫系视觉、支持 GitHub Pages 相对路径部署

## 本地开发

本仓库使用 `pnpm`。如果本机没有全局 `pnpm`，可用任意等价方式安装后执行：

```bash
pnpm install
pnpm test
pnpm dev
```

生产构建：

```bash
pnpm build
pnpm preview
```

## 协议说明

`nya58-zh2` 保持原始 Unicode，不做 NFC / NFKC 归一化，也不折叠全角 `！`、全角 `～` 与 `〜`。

编码流程：

1. 文本按原样转成 UTF-8 字节
2. 同时尝试 `raw` 与 `zstd-dict`
3. 打包为 `NY` frame，写入版本、codec、原文字节长度，并把剩余字节全部视为 payload
4. frame 走无 padding 的 58 进制 digit 切片
5. digit 直接映射到固定 58-token 猫语表，输出串中的每个 token 都承载 payload

`nya58-zh2` 不兼容旧版 `nya58-zh1` 编码串；旧串不会作为 fallback 自动解码。

## 词表

固定顺序如下：

```text
0 ！   1 ～   2 喵喵 3 咪喵 4 喵呜 5 咪呜 6 喵嗷 7 咪嗷 8 呼噜 9 咕噜
10 mew 11 MEW 12 meo 13 MEO 14 mia 15 MIA 16 mio 17 MIO 18 miu 19 MIU
20 mao 21 MAO 22 mau 23 MAU 24 mow 25 MOW 26 nya 27 NYA 28 nyo 29 NYO
30 nyu 31 NYU 32 mya 33 MYA 34 myo 35 MYO 36 myu 37 MYU 38 mrr 39 MRR
40 prr 41 PRR 42 pur 43 PUR 44 mur 45 MUR 46 eow 47 EOW 48 iao 49 IAO
50 iau 51 IAU 52 yow 53 YOW 54 urr 55 URR 56 rrr 57 RRR
```

## 字典资产

浏览器端使用仓库内静态资产 [src/assets/dict_v1.bin](src/assets/dict_v1.bin)。

训练种子样本位于 [protocol/dict_v1/samples](protocol/dict_v1/samples)，可用下面的命令重新生成字典：

```bash
python3 -m pip install --target /tmp/zstdpy zstandard
PYTHONPATH=/tmp/zstdpy python3 scripts/train_dict_v1.py
```

## 部署

仓库包含 GitHub Pages workflow。推送到 `main` 或 `master` 时会自动执行测试、构建并发布 `dist/`。

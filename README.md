# 猫语翻译器

一个部署到 GitHub Pages 的静态单页网站，实现可逆猫语协议 `nya128-zh9`。

## 特性

- 任意 Unicode 文本 `-> UTF-8 -> codec frame -> base128 digit -> 128-token 猫语`
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

社交预览图和站点图标由 [scripts/generate_social_assets.swift](scripts/generate_social_assets.swift) 生成：

```bash
pnpm run assets:social
```

## 协议说明

`nya128-zh9` 保持原始 Unicode，不做 NFC / NFKC 归一化，也不折叠全角 `！`、全角 `～` 与 `〜`。

编码流程：

1. 文本按原样转成 UTF-8 字节
2. 同时尝试 `raw` 与 `zstd-dict`
3. 打包为极简 codec frame：首字节是 codec tag，剩余字节全部视为 payload
4. codec frame 走无 padding 的 128 进制 digit 切片
5. digit 直接映射到固定 128-token 猫语表，输出串中的每个 token 都承载 payload

协议内部的 `CodecId` 与 wire tag 分开表示：UI / meta 中的 codec id 使用 `0 raw`、`1 zstd-dict`；写入 codec frame 首字节的 wire tag 固定为：

```text
1 raw
2 zstd-dict
```

## 词表

固定顺序如下：

```text
0 ！   1 ～   2 喵喵 3 咪喵 4 喵呜 5 咪呜 6 喵嗷 7 咪嗷 8 呼噜 9 咕噜
10 mew 11 MEW 12 meo 13 MEO 14 mia 15 MIA 16 mio 17 MIO 18 miu 19 MIU
20 mao 21 MAO 22 mau 23 MAU 24 mow 25 MOW 26 nya 27 NYA 28 nyo 29 NYO
30 nyu 31 NYU 32 mya 33 MYA 34 myo 35 MYO 36 myu 37 MYU 38 mrr 39 MRR
40 prr 41 PRR 42 pur 43 PUR 44 mur 45 MUR 46 eow 47 EOW 48 iao 49 IAO
50 iau 51 IAU 52 yow 53 YOW 54 urr 55 URR 56 rrr 57 RRR
58 哈 59 — 60 瞄瞄 61 喵咪 62 喵喔 63 喵唔 64 喵呼 65 眯喵 66 迷喵 67 咪描
68 咪瞄 69 喵乌 70 喵屋 71 喵嗚 72 咪乌 73 咪屋 74 咪唔 75 咪嗚 76 咪呼 77 苗嗷
78 瞄嗷 79 喵凹 80 喵熬 81 喵嚎 82 喵奥 83 喵敖 84 眯嗷 85 迷嗷 86 咪凹 87 咪熬
88 咪嚎 89 咪奥 90 咪敖 91 乎噜 92 忽噜 93 惚噜 94 估噜 95 姑噜 96 菇噜 97 箍噜
98 嗷呜 99 嗷乌 100 嗷屋 101 熬呜 102 敖呜 103 遨呜 104 嗷唔 105 嗷喔 106 嗷喵 107 咪咪喵
108 … 109 , 110 ， 111 ! 112 ~ 113 、 114 ？ 115 ? 116 ... 117 。。。 118 <space>
119 (^_^) 120 (^o^) 121 (^w^) 122 (^ω^) 123 (^x^) 124 (^ェ^) 125 (^ﻌ^) 126 (•ω•) 127 (•ᆺ•)
```

## 字典资产

浏览器端使用仓库内静态资产 [src/assets/dict_v1.bin](src/assets/dict_v1.bin)。

训练种子样本位于 [protocol/dict_v1/samples](protocol/dict_v1/samples)，可用下面的命令重新生成字典：
样本来源记录见 [protocol/dict_v1/SOURCES.md](protocol/dict_v1/SOURCES.md)。

```bash
python3 -m pip install --target /tmp/zstdpy zstandard
PYTHONPATH=/tmp/zstdpy python3 scripts/train_dict_v1.py
```

## 部署

仓库包含 GitHub Pages workflow。推送到 `main` 或 `master` 时会自动执行测试、构建并发布 `dist/`。

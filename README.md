# 猫语翻译器

一个部署到 GitHub Pages 的静态单页网站，实现可逆猫语协议 `nya155-zh11`。

## 特性

- 任意 Unicode 文本 `-> UTF-8 -> codec frame -> base155 digit -> 155-token 猫语`
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

`nya155-zh11` 保持原始 Unicode，不做 NFC / NFKC 归一化，也不折叠全角 `！`、全角 `～`、全角 `；` 与 `〜`。

编码流程：

1. 文本按原样转成 UTF-8 字节
2. 同时尝试 `raw` 与 `zstd-dict`
3. 打包为极简 codec frame：首字节是 codec tag，剩余字节全部视为 payload
4. codec frame 走无 padding 的 155 进制 digit 切片
5. digit 直接映射到固定 155-token 猫语表，输出串中的每个 token 都承载 payload

协议内部的 `CodecId` 与 wire tag 分开表示：UI / meta 中的 codec id 使用 `0 raw`、`1 zstd-dict`；写入 codec frame 首字节的 wire tag 固定为：

```text
1 raw
2 zstd-dict
```

## 词表

固定顺序如下：

```text
0 ！   1 ～   2 喵喵 3 咪喵 4 喵呜 5 咪呜 6 喵嗷 7 咪嗷 8 呼噜 9 咕噜
10 mew 11 MEW 12 Mew 13 meo 14 MEO 15 Meo 16 mia 17 MIA 18 Mia 19 mio
20 MIO 21 Mio 22 miu 23 MIU 24 Miu 25 mao 26 MAO 27 Mao 28 mau 29 MAU
30 Mau 31 mow 32 MOW 33 Mow 34 nya 35 NYA 36 Nya 37 nyo 38 NYO 39 Nyo
40 nyu 41 NYU 42 Nyu 43 mya 44 MYA 45 Mya 46 myo 47 MYO 48 Myo 49 myu
50 MYU 51 Myu 52 mrr 53 MRR 54 Mrr 55 prr 56 PRR 57 Prr 58 pur 59 PUR
60 Pur 61 mur 62 MUR 63 Mur 64 eow 65 EOW 66 Eow 67 iao 68 IAO 69 Iao
70 iau 71 IAU 72 Iau 73 yow 74 YOW 75 Yow 76 urr 77 URR 78 Urr 79 rrr
80 RRR 81 Rrr
82 哈 83 — 84 瞄瞄 85 喵咪 86 喵喔 87 喵唔 88 喵呼 89 眯喵 90 迷喵 91 咪描
92 咪瞄 93 喵乌 94 喵屋 95 喵嗚 96 咪乌 97 咪屋 98 咪唔 99 咪嗚 100 咪呼 101 苗嗷
102 瞄嗷 103 喵凹 104 喵熬 105 喵嚎 106 喵奥 107 喵敖 108 眯嗷 109 迷嗷 110 咪凹 111 咪熬
112 咪嚎 113 咪奥 114 咪敖 115 乎噜 116 忽噜 117 惚噜 118 估噜 119 姑噜 120 菇噜 121 箍噜
122 嗷呜 123 嗷乌 124 嗷屋 125 熬呜 126 敖呜 127 遨呜 128 嗷唔 129 嗷喔 130 嗷喵 131 咪咪喵
132 … 133 , 134 ， 135 ! 136 ~ 137 、 138 ？ 139 ? 140 ... 141 。。。 142 <space>
143 (^_^) 144 (^o^) 145 (^w^) 146 (^ω^) 147 (^x^) 148 (^ェ^) 149 (^ﻌ^) 150 (•ω•) 151 (•ᆺ•)
152 <newline> 153 ; 154 ；
```

其中 `<newline>` 表示 U+000A 换行符 `\n`，`<space>` 表示 U+0020 空格。

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

const fallbackBuilderCode = 'bc_9xpuvim3'
const fallbackBuilderCodeEncoded =
  '0x62635f3978707576696d330b0080218021802180218021802180218021'

export const appConfig = {
  appName: 'LuckySpin',
  builderCode: process.env.NEXT_PUBLIC_BASE_BUILDER_CODE ?? fallbackBuilderCode,
  builderCodeEncoded:
    process.env.NEXT_PUBLIC_BASE_BUILDER_CODE_ENCODED ?? fallbackBuilderCodeEncoded,
  contractAddress: '0x1b644BdEd084BAfF106124361B44cCcDE0bBD4b7' as const,
  baseAppId: '69c355f65262875b1be38c67',
  projectVerification:
    '6f886623c2b085412f6ff97f18d1da39549f609a33a947f5c2b8c17f617ee0b60f811c5e03351062658fc10c04cc2b59006e745ee4a3b0e75024d39a090d3ca4',
} as const

export const builderCode = fallbackBuilderCode
export const builderCodeEncoded = fallbackBuilderCodeEncoded

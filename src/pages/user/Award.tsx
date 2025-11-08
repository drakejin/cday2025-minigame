import { CrownOutlined, InfoCircleOutlined, StarOutlined, TrophyOutlined } from '@ant-design/icons'
import { Avatar, Button, Spin, Typography } from 'antd'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import styled, { css, keyframes } from 'styled-components'
import { GameRuleModal } from '@/components/common/GameRuleModal'
import { MainLayout } from '@/components/layout/MainLayout'
import { useLeaderboard } from '@/hooks/queries/useLeaderboardQuery'
import { useAuthStore } from '@/store/authStore'
import type { LeaderboardEntry } from '@/types'

const { Title, Text } = Typography

// Mock data for demonstration
const MOCK_DATA: LeaderboardEntry[] = []

// Animated gradient background
const gradientAnimation = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`

const floatAnimation = keyframes`
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-20px) scale(1.05);
  }
`

const glowAnimation = keyframes`
  0%, 100% {
    box-shadow: 0 0 40px rgba(255, 215, 0, 0.6), 0 0 80px rgba(255, 215, 0, 0.4);
  }
  50% {
    box-shadow: 0 0 60px rgba(255, 215, 0, 0.8), 0 0 120px rgba(255, 215, 0, 0.6);
  }
`

const sparkleAnimation = keyframes`
  0%, 100% {
    opacity: 0;
    transform: scale(0) rotate(0deg);
  }
  50% {
    opacity: 1;
    transform: scale(1) rotate(180deg);
  }
`

const AwardContainer = styled.div`
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(
    -45deg,
    #ee7752,
    #e73c7e,
    #23a6d5,
    #23d5ab,
    #ff6b6b,
    #4ecdc4,
    #45b7d1,
    #f7b731,
    #5f27cd,
    #00d2d3
  );
  background-size: 400% 400%;
  ${css`
    animation: ${gradientAnimation} 15s ease infinite;
  `}
  padding: 20px 8px;
  overflow-x: hidden;
  position: relative;

  @media (min-width: 768px) {
    padding: 40px 30px;
  }

  @media (min-width: 1024px) {
    padding: 60px 40px;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 40% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
    pointer-events: none;
  }
`

const Header = styled.div`
  text-align: center;
  margin-bottom: 30px;
  position: relative;
  z-index: 1;

  @media (min-width: 768px) {
    margin-bottom: 50px;
  }

  @media (min-width: 1024px) {
    margin-bottom: 80px;
  }
`

const MainTitle = styled(Title)`
  &&& {
    font-size: 36px;
    font-weight: 900;
    color: #ffffff;
    margin: 0;
    text-shadow: 0 0 30px rgba(255, 255, 255, 0.8), 0 0 60px rgba(255, 215, 0, 0.6),
      0 10px 30px rgba(0, 0, 0, 0.3);
    letter-spacing: 2px;
    text-transform: uppercase;

    @media (min-width: 768px) {
      font-size: 72px;
      letter-spacing: 4px;
    }

    @media (min-width: 1024px) {
      font-size: 96px;
      letter-spacing: 6px;
    }

    @media (min-width: 1920px) {
      font-size: 120px;
      letter-spacing: 8px;
    }
  }
`

const TopThreeContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 30px;
  margin-bottom: 40px;
  position: relative;
  z-index: 1;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: flex-end;
    gap: 40px;
    margin-bottom: 60px;
  }

  @media (min-width: 1024px) {
    gap: 60px;
    margin-bottom: 80px;
  }

  @media (min-width: 1920px) {
    margin-bottom: 100px;
  }
`

const WinnerCard = styled.div<{ $rank: number }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  position: relative;
  width: 100%;
  max-width: 400px;
  ${(props) => css`
    animation: ${floatAnimation} ${3 + props.$rank * 0.5}s ease-in-out infinite;
    animation-delay: ${props.$rank * 0.2}s;
  `}

  @media (min-width: 768px) {
    gap: 25px;
    max-width: none;
    width: auto;

    ${(props) =>
      props.$rank === 1 &&
      `
      transform: scale(1.15);
      z-index: 3;
    `}

    ${(props) =>
      props.$rank === 2 &&
      `
      transform: scale(1.05);
      z-index: 2;
    `}

    ${(props) =>
      props.$rank === 3 &&
      `
      transform: scale(1.05);
      z-index: 2;
    `}
  }

  @media (min-width: 1024px) {
    gap: 30px;

    ${(props) =>
      props.$rank === 1 &&
      `
      transform: scale(1.25);
    `}

    ${(props) =>
      props.$rank === 2 &&
      `
      transform: scale(1.08);
    `}

    ${(props) =>
      props.$rank === 3 &&
      `
      transform: scale(1.08);
    `}
  }

  @media (min-width: 1920px) {
    ${(props) =>
      props.$rank === 1 &&
      `
      transform: scale(1.3);
    `}

    ${(props) =>
      props.$rank === 2 &&
      `
      transform: scale(1.1);
    `}

    ${(props) =>
      props.$rank === 3 &&
      `
      transform: scale(1.1);
    `}
  }
`

const RankBadge = styled.div<{ $rank: number }>`
  width: ${(props) => (props.$rank === 1 ? '100px' : '80px')};
  height: ${(props) => (props.$rank === 1 ? '100px' : '80px')};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${(props) => (props.$rank === 1 ? '50px' : '40px')};
  font-weight: 900;
  color: white;
  position: relative;
  background: ${(props) =>
    props.$rank === 1
      ? 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)'
      : props.$rank === 2
        ? 'linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%)'
        : 'linear-gradient(135deg, #cd7f32 0%, #daa520 100%)'};

  @media (min-width: 768px) {
    width: ${(props) => (props.$rank === 1 ? '120px' : '100px')};
    height: ${(props) => (props.$rank === 1 ? '120px' : '100px')};
    font-size: ${(props) => (props.$rank === 1 ? '60px' : '50px')};
  }

  @media (min-width: 1024px) {
    width: ${(props) => (props.$rank === 1 ? '140px' : '110px')};
    height: ${(props) => (props.$rank === 1 ? '140px' : '110px')};
    font-size: ${(props) => (props.$rank === 1 ? '70px' : '55px')};
  }

  @media (min-width: 1920px) {
    width: ${(props) => (props.$rank === 1 ? '160px' : '120px')};
    height: ${(props) => (props.$rank === 1 ? '160px' : '120px')};
    font-size: ${(props) => (props.$rank === 1 ? '80px' : '60px')};
  }

  ${(props) =>
    props.$rank === 1 &&
    css`
      animation: ${glowAnimation} 2s ease-in-out infinite;
    `}

  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);

  @media (min-width: 768px) {
    box-shadow: 0 15px 45px rgba(0, 0, 0, 0.3);
  }

  @media (min-width: 1920px) {
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  &::before {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    top: 10%;
    right: 10%;

    @media (min-width: 1024px) {
      width: 25px;
      height: 25px;
    }

    @media (min-width: 1920px) {
      width: 30px;
      height: 30px;
    }

    ${(props) => css`
      animation: ${sparkleAnimation} 2s ease-in-out infinite;
      animation-delay: ${props.$rank * 0.3}s;
    `}
  }
`

const WinnerAvatar = styled(Avatar)`
  &&& {
    width: 150px;
    height: 150px;
    border: 4px solid white;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 255, 255, 0.3);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

    @media (min-width: 768px) {
      width: 200px;
      height: 200px;
      border: 6px solid white;
      box-shadow: 0 15px 45px rgba(0, 0, 0, 0.4), 0 0 30px rgba(255, 255, 255, 0.3);
    }

    @media (min-width: 1024px) {
      width: 240px;
      height: 240px;
    }

    @media (min-width: 1920px) {
      width: 280px;
      height: 280px;
      border: 8px solid white;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(255, 255, 255, 0.3);
    }
  }
`

const WinnerInfo = styled.div`
  text-align: center;
  background: rgba(255, 255, 255, 0.95);
  padding: 20px 25px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  min-width: 280px;

  @media (min-width: 768px) {
    padding: 30px 40px;
    border-radius: 25px;
    min-width: 320px;
    box-shadow: 0 15px 45px rgba(0, 0, 0, 0.3);
  }

  @media (min-width: 1920px) {
    padding: 40px 50px;
    border-radius: 30px;
    min-width: 350px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }
`

const WinnerName = styled(Title)`
  &&& {
    font-size: 24px;
    margin: 0 0 8px 0;
    color: #2c3e50;
    font-weight: 800;

    @media (min-width: 768px) {
      font-size: 32px;
    }

    @media (min-width: 1024px) {
      font-size: 40px;
      margin: 0 0 10px 0;
    }

    @media (min-width: 1920px) {
      font-size: 48px;
    }
  }
`

const CharacterName = styled(Text)`
  font-size: 18px;
  color: #7f8c8d;
  display: block;
  margin-bottom: 10px;
  font-weight: 500;

  @media (min-width: 768px) {
    font-size: 24px;
    margin-bottom: 12px;
  }

  @media (min-width: 1024px) {
    font-size: 30px;
  }

  @media (min-width: 1920px) {
    font-size: 36px;
    margin-bottom: 15px;
  }
`

const CurrentPrompt = styled(Text)`
  font-size: 14px;
  color: #95a5a6;
  display: block;
  margin-bottom: 8px;
  font-style: italic;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (min-width: 768px) {
    font-size: 18px;
    margin-bottom: 10px;
  }

  @media (min-width: 1024px) {
    font-size: 22px;
  }

  @media (min-width: 1920px) {
    font-size: 26px;
    margin-bottom: 12px;
  }
`

const Score = styled.div`
  font-size: 32px;
  font-weight: 900;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-top: 10px;

  @media (min-width: 768px) {
    font-size: 40px;
    margin-top: 12px;
  }

  @media (min-width: 1024px) {
    font-size: 48px;
  }

  @media (min-width: 1920px) {
    font-size: 56px;
    margin-top: 15px;
  }
`

const RankingList = styled.div`
  max-width: 1800px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  position: relative;
  z-index: 1;

  @media (min-width: 768px) {
    gap: 25px;
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 30px;
  }

  @media (min-width: 1920px) {
    gap: 40px;
  }
`

const RankingItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.95);
  padding: 8px 6px;
  border-radius: 10px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  min-width: 0;

  @media (min-width: 768px) {
    gap: 25px;
    padding: 25px 35px;
    border-radius: 20px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  }

  @media (min-width: 1024px) {
    gap: 30px;
    padding: 30px 40px;
  }

  @media (min-width: 1920px) {
    gap: 40px;
    padding: 35px 45px;
    border-radius: 25px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 35px rgba(0, 0, 0, 0.3);

    @media (min-width: 768px) {
      transform: translateY(-5px);
      box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3);
    }
  }
`

const RankNumber = styled.div`
  font-size: 16px;
  font-weight: 900;
  color: #7f8c8d;
  min-width: 24px;
  text-align: center;
  flex-shrink: 0;

  @media (min-width: 768px) {
    font-size: 40px;
    min-width: 60px;
  }

  @media (min-width: 1024px) {
    font-size: 48px;
    min-width: 70px;
  }

  @media (min-width: 1920px) {
    font-size: 56px;
    min-width: 80px;
  }
`

const RankAvatar = styled(Avatar)`
  &&& {
    width: 36px;
    height: 36px;
    border: 2px solid #e0e0e0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    flex-shrink: 0;

    @media (min-width: 768px) {
      width: 80px;
      height: 80px;
      border: 3px solid #e0e0e0;
    }

    @media (min-width: 1024px) {
      width: 90px;
      height: 90px;
    }

    @media (min-width: 1920px) {
      width: 100px;
      height: 100px;
      border: 4px solid #e0e0e0;
    }
  }
`

const RankInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const RankName = styled(Title)`
  &&& {
    font-size: 12px;
    margin: 0 0 2px 0;
    color: #2c3e50;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;

    @media (min-width: 768px) {
      font-size: 24px;
      margin: 0 0 6px 0;
    }

    @media (min-width: 1024px) {
      font-size: 30px;
      margin: 0 0 8px 0;
    }

    @media (min-width: 1920px) {
      font-size: 36px;
    }
  }
`

const RankCharacter = styled(Text)`
  font-size: 10px;
  color: #7f8c8d;
  display: block;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;

  @media (min-width: 768px) {
    font-size: 18px;
  }

  @media (min-width: 1024px) {
    font-size: 22px;
  }

  @media (min-width: 1920px) {
    font-size: 28px;
  }
`

const RankPrompt = styled(Text)`
  font-size: 9px;
  color: #95a5a6;
  display: block;
  font-style: italic;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;

  @media (min-width: 768px) {
    font-size: 14px;
  }

  @media (min-width: 1024px) {
    font-size: 16px;
  }

  @media (min-width: 1920px) {
    font-size: 20px;
  }
`

const RankScore = styled.div`
  font-size: 12px;
  font-weight: 800;
  color: #667eea;
  text-align: right;
  min-width: 28px;
  flex-shrink: 0;

  @media (min-width: 768px) {
    font-size: 28px;
    min-width: 100px;
  }

  @media (min-width: 1024px) {
    font-size: 36px;
    min-width: 120px;
  }

  @media (min-width: 1920px) {
    font-size: 44px;
    min-width: 150px;
  }
`

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
`

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <CrownOutlined />
    case 2:
      return <TrophyOutlined />
    case 3:
      return <StarOutlined />
    default:
      return rank
  }
}

export const Award: FC = () => {
  const { data: leaderboard, isLoading } = useLeaderboard(50, 0)
  const user = useAuthStore((state) => state.user)
  const [isMobile, setIsMobile] = useState(false)
  const [showGameRuleModal, setShowGameRuleModal] = useState(false)

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Auto reload page every 2 minutes
  useEffect(() => {
    const reloadInterval = setInterval(() => {
      window.location.reload()
    }, 120000) // 2 minutes = 120000ms

    return () => clearInterval(reloadInterval)
  }, [])

  // Use mock data if loading or no data
  const displayData = leaderboard?.data || MOCK_DATA

  if (isLoading && !displayData.length) {
    return (
      <AwardContainer>
        <LoadingContainer>
          <Spin size="large" />
        </LoadingContainer>
      </AwardContainer>
    )
  }

  const topThree = displayData.slice(0, 3)
  const remaining = displayData.slice(3)

  const reorderedTopThree = isMobile
    ? topThree
    : [topThree[1], topThree[0], topThree[2]].filter(Boolean)

  return (
    <MainLayout showBottomNav={!!user} withoutPadding={true}>
      <AwardContainer>
        <Button
          type="text"
          icon={<InfoCircleOutlined />}
          onClick={() => setShowGameRuleModal(true)}
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 1000,
            color: 'white',
            fontSize: 24,
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
          }}
        />
        <Header>
          <MainTitle level={1}>Character Battle</MainTitle>
        </Header>

        {topThree.length > 0 && (
          <TopThreeContainer>
            {reorderedTopThree.map((entry) => {
              const actualRank = entry.rank
              return (
                <WinnerCard key={entry.character_id} $rank={actualRank}>
                  <RankBadge $rank={actualRank}>{getRankIcon(actualRank)}</RankBadge>
                  <WinnerAvatar
                    size={280}
                    src={entry.avatar_url || undefined}
                    alt={entry.display_name}
                  >
                    {!entry.avatar_url && entry.display_name[0]?.toUpperCase()}
                  </WinnerAvatar>
                  <WinnerInfo>
                    <WinnerName level={2}>{entry.display_name}</WinnerName>
                    <CharacterName>{entry.character_name}</CharacterName>
                    {entry.current_prompt && (
                      <CurrentPrompt>"{entry.current_prompt}"</CurrentPrompt>
                    )}
                    <Score>{entry.total_score.toLocaleString()}</Score>
                  </WinnerInfo>
                </WinnerCard>
              )
            })}
          </TopThreeContainer>
        )}

        {remaining.length > 0 && (
          <RankingList>
            {remaining.map((entry) => (
              <RankingItem key={entry.character_id}>
                <RankNumber>{entry.rank}</RankNumber>
                <RankAvatar size={100} src={entry.avatar_url || undefined} alt={entry.display_name}>
                  {!entry.avatar_url && entry.display_name[0]?.toUpperCase()}
                </RankAvatar>
                <RankInfo>
                  <RankName level={3}>{entry.display_name}</RankName>
                  <RankCharacter>{entry.character_name}</RankCharacter>
                  {entry.current_prompt && <RankPrompt>"{entry.current_prompt}"</RankPrompt>}
                </RankInfo>
                <RankScore>{entry.total_score.toLocaleString()}</RankScore>
              </RankingItem>
            ))}
          </RankingList>
        )}
      </AwardContainer>
      <GameRuleModal open={showGameRuleModal} onClose={() => setShowGameRuleModal(false)} />
    </MainLayout>
  )
}

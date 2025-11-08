import { Modal, Tabs, Typography } from 'antd'
import type { FC } from 'react'

const { Title, Paragraph, Text } = Typography

interface GameRuleModalProps {
  open: boolean
  onClose: () => void
}

export const GameRuleModal: FC<GameRuleModalProps> = ({ open, onClose }) => {
  const items = [
    {
      key: '1',
      label: '게임 기본 규칙',
      children: (
        <>
          <Title level={5}>게임 목표</Title>
          <Paragraph>
            총 3라운드에 걸쳐 진행되며, 3개의 '시련(Trial)'에서 획득한 점수를 합산하여 최종 우승자를
            가리는 프롬프트 경쟁 게임입니다.
          </Paragraph>

          <Title level={5}>라운드 진행</Title>
          <Paragraph>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li>총 라운드: 3 라운드</li>
              <li>라운드별 진행 시간: 총 30분</li>
              <li style={{ marginLeft: 20 }}>플레이어 행동 입력: 25분</li>
              <li style={{ marginLeft: 20 }}>집계 및 평가: 5분</li>
            </ul>
          </Paragraph>

          <Title level={5}>핵심 제한 사항</Title>
          <Paragraph>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li>
                <Text strong>승리 조건:</Text> 3개 시련의 누적 점수가 가장 높은 플레이어가 승리
              </li>
              <li>
                <Text strong>능력치 한계:</Text> 모든 능력치의 최대 수치는 20
              </li>
              <li>
                <Text strong>스킬:</Text> 1라운드 1개, 2라운드 1개, 3라운드 1개 (총 3개 누적)
              </li>
            </ul>
          </Paragraph>
        </>
      ),
    },
    {
      key: '2',
      label: '능력치',
      children: (
        <>
          <Title level={5}>힘 (Strength - STR)</Title>
          <Paragraph>
            육체적인 힘, 근력, 순수한 운동 능력
            <br />
            <Text type="secondary">예: 압도적인 공격, 제압 및 무너뜨리기</Text>
          </Paragraph>

          <Title level={5}>민첩 (Dexterity - DEX)</Title>
          <Paragraph>
            순발력, 균형 감각, 손재주, 반사 신경
            <br />
            <Text type="secondary">예: 회피 기동, 정밀한 공격, 받아치기</Text>
          </Paragraph>

          <Title level={5}>건강 (Constitution - CON)</Title>
          <Paragraph>
            체력, 맷집, 인내력, 정신적 저항력
            <br />
            <Text type="secondary">예: 최대 생명력(HP) 결정, 고통 인내, 저항, 버티기</Text>
          </Paragraph>

          <Title level={5}>지능 (Intelligence - INT)</Title>
          <Paragraph>
            학문적 지식, 기억력, 논리력, 전술적 통찰력 (모든 마법 능력의 근원)
            <br />
            <Text type="secondary">예: 마법 사용, 약점 분석, 행동 예측</Text>
          </Paragraph>
        </>
      ),
    },
    {
      key: '3',
      label: '캐릭터 성장',
      children: (
        <>
          <Title level={5}>Lv.1 기본 능력치</Title>
          <Paragraph>
            시작 시 <Text code>[15, 14, 12, 10]</Text> 숫자를 4가지 능력치에 하나씩 배정
            <br />+ 스킬 1개 정의
          </Paragraph>

          <Title level={5}>레벨업 (Lv.2 & Lv.3)</Title>
          <Paragraph>
            라운드마다 레벨업하여 다음을 획득:
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li>새로운 스킬 1개</li>
              <li>보너스 능력치 +2 포인트</li>
            </ul>
          </Paragraph>

          <Title level={5}>능력치 포인트 투자 규칙</Title>
          <Paragraph>
            <Text strong>+2 포인트는 반드시 서로 다른 2개 능력치에 +1씩 분배</Text>
            <br />
            <Text type="success">✓ 힘 +1, 건강 +1</Text>
            <br />
            <Text type="danger">✗ 힘 +2 (한 능력치에 몰아서 투자 불가)</Text>
          </Paragraph>

          <Title level={5}>예시</Title>
          <Paragraph style={{ fontSize: 12 }}>
            <Text strong>Lv.1:</Text> STR 15, DEX 12, CON 14, INT 10 / 스킬: [강력한 일격]
            <br />
            <Text strong>Lv.2:</Text> STR +1, CON +1 / 스킬: [방패 밀치기]
            <br />
            <Text strong>Lv.3:</Text> STR +1, DEX +1 / 스킬: [최후의 저항]
            <br />
            <Text type="secondary">최종: STR 17, DEX 13, CON 15, INT 10 / 스킬 3개</Text>
          </Paragraph>
        </>
      ),
    },
    {
      key: '4',
      label: '시련 시스템',
      children: (
        <>
          <Title level={5}>3개 시련과 배점</Title>
          <Paragraph>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li>
                <Text strong>시련 1 (Lv.1):</Text> 최대 100점
              </li>
              <li>
                <Text strong>시련 2 (Lv.2):</Text> 최대 200점
              </li>
              <li>
                <Text strong>시련 3 (Lv.3):</Text> 최대 400점
              </li>
              <li>
                <Text strong type="warning">
                  최종 만점: 700점
                </Text>
              </li>
            </ul>
          </Paragraph>

          <Title level={5}>연쇄 재평가 규칙 (중요!)</Title>
          <Paragraph>
            <Text strong>캐릭터 시트 수정 시 전체 재평가:</Text>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li>
                <Text strong>Lv.1 수정</Text> → 시련 1, 2, 3 모두 재평가
              </li>
              <li>
                <Text strong>Lv.2 수정</Text> → 시련 2, 3 재평가
              </li>
              <li>
                <Text strong>Lv.3 수정</Text> → 시련 3만 재평가
              </li>
            </ul>
          </Paragraph>

          <Paragraph>
            <Text type="warning">⚠️ 일관된 캐릭터 빌드만 가능 - 시련마다 다른 스킬 사용 불가</Text>
          </Paragraph>

          <Title level={5}>지각 참여자 규칙</Title>
          <Paragraph>
            늦게 참여해도 우승 가능!
            <br />
            3라운드의 배점(400점)이 높아 타임어택의 불리함은 있지만 점수 차별은 없습니다.
          </Paragraph>
        </>
      ),
    },
    {
      key: '5',
      label: '최종 순위',
      children: (
        <>
          <Title level={5}>승리 조건</Title>
          <Paragraph>
            3라운드 집계 종료 시, <Text strong>3개 시련의 누적 점수가 가장 높은</Text> 플레이어가
            최종 우승자가 됩니다.
          </Paragraph>

          <Title level={5}>전략 포인트</Title>
          <Paragraph>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li>시련 3의 배점이 가장 높음 (400점)</li>
              <li>캐릭터 빌드 수정은 신중하게 (연쇄 재평가)</li>
              <li>일관성 있는 성장 계획 수립이 중요</li>
              <li>프롬프트 작성 시 캐릭터 능력치와 스킬 활용</li>
            </ul>
          </Paragraph>
        </>
      ),
    },
  ]

  return (
    <Modal
      title="게임 룰 가이드"
      open={open}
      onCancel={onClose}
      footer={null}
      width="100%"
      style={{ maxWidth: 600, top: 20 }}
      styles={{
        body: {
          maxHeight: 'calc(100vh - 120px)',
          overflowY: 'auto',
        },
      }}
    >
      <Tabs
        defaultActiveKey="1"
        items={items}
        tabPosition="top"
        style={{ marginTop: -8 }}
        size="small"
      />
    </Modal>
  )
}

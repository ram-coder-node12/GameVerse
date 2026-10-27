// server/tests/matchmaking.test.js
const matchmakingService = require('../services/matchmakingService');

describe('MatchmakingService Unit Tests', () => {
  beforeEach(() => {
    // Clear queues before each test
    matchmakingService.queues.TIC_TAC_TOE = [];
    matchmakingService.queues.CONNECT_FOUR = [];
  });

  const player1 = { id: 'user_1', username: 'GamerAlpha', rating: 1000, avatar: 'avatar1.png' };
  const player2 = { id: 'user_2', username: 'GamerBeta', rating: 1050, avatar: 'avatar2.png' };

  test('Single player joins queue and waits', () => {
    const res = matchmakingService.joinQueue('TIC_TAC_TOE', 'socket_1', player1);
    expect(res.matched).toBe(false);
    expect(matchmakingService.getQueueCount('TIC_TAC_TOE')).toBe(1);
    expect(matchmakingService.isInQueue(player1.id)).toBe('TIC_TAC_TOE');
  });

  test('Duplicate queue prevention for same user', () => {
    matchmakingService.joinQueue('TIC_TAC_TOE', 'socket_1', player1);
    // Player 1 tries to join again
    matchmakingService.joinQueue('TIC_TAC_TOE', 'socket_1_new', player1);

    expect(matchmakingService.getQueueCount('TIC_TAC_TOE')).toBe(1);
  });

  test('Two distinct players joining same queue are matched', () => {
    const res1 = matchmakingService.joinQueue('TIC_TAC_TOE', 'socket_1', player1);
    expect(res1.matched).toBe(false);

    const res2 = matchmakingService.joinQueue('TIC_TAC_TOE', 'socket_2', player2);
    expect(res2.matched).toBe(true);
    expect(res2.match).toBeDefined();
    expect(res2.match.roomId).toBeDefined();
    expect(res2.match.player1.user.id).toBe(player1.id);
    expect(res2.match.player2.user.id).toBe(player2.id);

    // Queue should now be empty after match
    expect(matchmakingService.getQueueCount('TIC_TAC_TOE')).toBe(0);
  });

  test('Player can leave queue', () => {
    matchmakingService.joinQueue('CONNECT_FOUR', 'socket_1', player1);
    expect(matchmakingService.getQueueCount('CONNECT_FOUR')).toBe(1);

    const left = matchmakingService.leaveQueue('CONNECT_FOUR', player1.id, 'socket_1');
    expect(left).toBe(true);
    expect(matchmakingService.getQueueCount('CONNECT_FOUR')).toBe(0);
    expect(matchmakingService.isInQueue(player1.id)).toBeNull();
  });

  test('Queues for different game types remain isolated', () => {
    matchmakingService.joinQueue('TIC_TAC_TOE', 'socket_1', player1);
    matchmakingService.joinQueue('CONNECT_FOUR', 'socket_2', player2);

    expect(matchmakingService.getQueueCount('TIC_TAC_TOE')).toBe(1);
    expect(matchmakingService.getQueueCount('CONNECT_FOUR')).toBe(1);
  });
});

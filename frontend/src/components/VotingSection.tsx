import { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';

interface VotingSectionProps {
    campaignId: number;
    onVote: () => void;
}

export default function VotingSection({ campaignId, onVote }: VotingSectionProps) {
    const { contract, address } = useWeb3();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasVoted, setHasVoted] = useState(false);
    const [voteStats, setVoteStats] = useState({
        totalVotes: 0,
        approvalVotes: 0,
        rejectionVotes: 0
    });

    useEffect(() => {
        if (contract && address) {
            loadVotingStatus();
        }
    }, [contract, address, campaignId]);

    const loadVotingStatus = async () => {
        if (!contract || !address) return;

        try {
            const [voted, stats] = await Promise.all([
                contract.hasVoted(campaignId, address),
                contract.getVoteStats(campaignId)
            ]);

            setHasVoted(voted);
            setVoteStats({
                totalVotes: Number(stats[0]),
                approvalVotes: Number(stats[1]),
                rejectionVotes: Number(stats[2])
            });
        } catch (error) {
            console.error('Error loading voting status:', error);
        }
    };

    const handleVote = async (voteForAllOrNothing: boolean) => {
        if (!contract) return;

        try {
            setLoading(true);
            setError('');

            const tx = await contract.vote(campaignId, voteForAllOrNothing);
            await tx.wait();
            
            setHasVoted(true);
            onVote();
            await loadVotingStatus();
        } catch (error: any) {
            console.error('Error voting:', error);
            setError(error.message || 'Failed to vote. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Voting for Campaign Outcome</h3>
            
            <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Current Voting Status:</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-white p-3 rounded shadow">
                        <p className="text-sm text-gray-500">Total Votes</p>
                        <p className="text-lg font-semibold">{voteStats.totalVotes}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded shadow">
                        <p className="text-sm text-gray-500">All or Nothing</p>
                        <p className="text-lg font-semibold text-green-600">{voteStats.approvalVotes}</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded shadow">
                        <p className="text-sm text-gray-500">Keep Raised</p>
                        <p className="text-lg font-semibold text-red-600">{voteStats.rejectionVotes}</p>
                    </div>
                </div>
            </div>

            {!hasVoted ? (
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        This campaign did not reach its funding goal. As a contributor, you can vote on whether to keep the raised funds or refund all contributions.
                    </p>

                    {error && (
                        <div className="text-red-600 text-sm">{error}</div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => handleVote(true)}
                            disabled={loading}
                            className="flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
                        >
                            {loading ? 'Voting...' : 'All or Nothing'}
                        </button>
                        <button
                            onClick={() => handleVote(false)}
                            disabled={loading}
                            className="flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400"
                        >
                            {loading ? 'Voting...' : 'Keep Raised'}
                        </button>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-gray-600">
                    You have already voted on this campaign's outcome.
                </p>
            )}
        </div>
    );
} 
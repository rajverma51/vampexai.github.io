import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { 
  Wallet, 
  Coins, 
  Users, 
  Lock, 
  ArrowUpRight, 
  ShieldCheck, 
  History, 
  Settings,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Fingerprint
} from 'lucide-react';
import { STAKING_ADDRESS, VAMP_ADDRESS, STAKING_ABI, VAMP_ABI } from './contracts/config';
import logo from './assets/logo.png';

function App() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState('0');
  const [userProfile, setUserProfile] = useState(null);
  const [stakes, setStakes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [referralInput, setReferralInput] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');
  const [secretInput, setSecretInput] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [fetchingProfile, setFetchingProfile] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const notify = (type, message) => {
    setStatus({ type, message });
    setTimeout(() => setStatus({ type: '', message: '' }), 5000);
  };

  const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
      } catch (err) {
        notify('error', 'Failed to connect wallet');
      }
    } else if (isMobile()) {
      // Mobile browser me window.ethereum nahi hota — MetaMask ke in-app browser mein open karo
      const dappUrl = 'rajverma51.github.io/vampexai.github.io';
      window.location.href = `https://metamask.app.link/dapp/${dappUrl}`;
    } else {
      notify('error', 'Please install MetaMask → https://metamask.io');
    }
  };

  const fetchData = useCallback(async () => {
    if (!account) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const stakingContract = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, provider);
      const tokenContract = new ethers.Contract(VAMP_ADDRESS, VAMP_ABI, provider);

      // Check if code exists
      const code = await provider.getCode(STAKING_ADDRESS);
      if (code === "0x") {
        setFetchError(`No contract at ${STAKING_ADDRESS}. Is it deployed on this network?`);
        setFetchingProfile(false);
        return;
      }

      // Token Balance
      const bal = await tokenContract.balanceOf(account).catch(() => 0n);
      setBalance(ethers.formatEther(bal));

      // User Profile
      const profile = await stakingContract.users(account);
      console.log("Profile Data:", profile);
      
      const isReg = profile.isRegistered || profile[0];

      setUserProfile({
        isRegistered: !!isReg,
        referrer: profile.referrer || profile[1],
        referralRewards: ethers.formatEther(profile.referralRewards || profile[3]),
        totalStaked: ethers.formatEther(profile.totalStaked || profile[4])
      });

      // User Stakes
      const stakeCount = await stakingContract.getUserStakeCount(account).catch(() => 0n);
      const userStakes = [];
      for (let i = 0; i < Number(stakeCount); i++) {
        const s = await stakingContract.userStakes(account, i);
        const reward = await stakingContract.getPendingReward(account, i).catch(() => 0n);
        userStakes.push({
          index: i,
          amount: ethers.formatEther(s.amount),
          startTime: Number(s.startTime),
          withdrawn: s.withdrawn,
          pendingReward: ethers.formatEther(reward)
        });
      }
      setStakes(userStakes.reverse());
      setFetchError(null);
      setFetchingProfile(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setFetchError(err.message);
      setFetchingProfile(false);
    }
  }, [account]);

  useEffect(() => {
    if (account) {
        setFetchingProfile(true);
        fetchData();
        const interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
    }
  }, [account, fetchData]);

  const handleRegister = async () => {
    if (!secretInput) return notify('error', 'Secret password is required');
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, signer);

      // If referrer field is empty OR same as own address, use ZeroAddress (first/root user)
      const rawReferrer = referralInput.trim();
      const referrer =
        !rawReferrer || rawReferrer.toLowerCase() === account.toLowerCase()
          ? ethers.ZeroAddress
          : rawReferrer;

      const secretHash = ethers.keccak256(ethers.toUtf8Bytes(secretInput));

      const tx = await contract.register(referrer, secretHash);
      await tx.wait();
      notify('success', 'Successfully registered!');
      setFetchingProfile(true);
      fetchData();
    } catch (err) {
      notify('error', err.reason || 'Registration failed');
    }
    setLoading(false);
  };

  const handleStake = async () => {
    if (!stakeAmount || isNaN(stakeAmount)) return notify('error', 'Invalid amount');
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const stakingContract = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, signer);
      const tokenContract = new ethers.Contract(VAMP_ADDRESS, VAMP_ABI, signer);

      const amount = ethers.parseEther(stakeAmount);
      const allowance = await tokenContract.allowance(account, STAKING_ADDRESS);
      if (allowance < amount) {
        const approveTx = await tokenContract.approve(STAKING_ADDRESS, ethers.MaxUint256);
        await approveTx.wait();
      }

      const tx = await stakingContract.stake(amount);
      await tx.wait();
      notify('success', 'Staked successfully!');
      fetchData();
    } catch (err) {
      notify('error', err.reason || 'Staking failed');
    }
    setLoading(false);
  };

  const handleWithdraw = async (index) => {
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, signer);

      const tx = await contract.withdrawStake(index);
      await tx.wait();
      notify('success', 'Withdrawal successful!');
      fetchData();
    } catch (err) {
      notify('error', err.reason || 'Withdrawal failed. Check lock period.');
    }
    setLoading(false);
  };

  const handleClaimReferral = async () => {
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, signer);

      const tx = await contract.claimReferralRewards();
      await tx.wait();
      notify('success', 'Rewards claimed!');
      fetchData();
    } catch (err) {
      notify('error', err.reason || 'Claim failed');
    }
    setLoading(false);
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="logo">
          <img src={logo} alt="VampExAI Logo" style={{ height: '42px' }} />
          VampExAI
        </div>
        {account ? (
          <div className="btn btn-outline">
            <Wallet size={18} />
            {account.slice(0, 6)}...{account.slice(-4)}
          </div>
        ) : (
          <button className="btn btn-primary" onClick={connectWallet}>
            <Wallet size={18} />
            Connect Wallet
          </button>
        )}
      </nav>

      {status.message && (
        <div className={`animated card`} style={{ marginBottom: '2rem', borderLeft: `4px solid ${status.type === 'error' ? '#ef4444' : '#22c55e'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {status.type === 'error' ? <AlertCircle color="#ef4444" /> : <CheckCircle2 color="#22c55e" />}
            <p>{status.message}</p>
          </div>
        </div>
      )}

      {fetchError && (
        <div className="card" style={{ marginBottom: '2rem', background: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' }}>
          <h4 style={{ color: '#ef4444' }}>Protocol Connection Error</h4>
          <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>{fetchError}</p>
        </div>
      )}

      {account && fetchingProfile && (
        <div className="card animated" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Syncing with Blockchain Protocol...</p>
        </div>
      )}

      {account && !fetchingProfile && !userProfile?.isRegistered && (
        <section className="animated card" style={{ marginBottom: '3rem' }}>
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck color="#8b5cf6" />
            Complete Registration
          </h2>
          <div className="dashboard-grid">
            <div className="input-group">
              <label>Referrer Address (Optional)</label>
              <input 
                placeholder="0x... (Leave empty if you are the first/root user)" 
                value={referralInput} 
                onChange={(e) => setReferralInput(e.target.value)}
              />
              <small style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                💡 Agar aap pehle user (sponsor) hain toh yeh field khaali chhod dein.
              </small>
            </div>
            <div className="input-group">
              <label>Secret Recovery Password (SAVE THIS!)</label>
              <input 
                type="password" 
                placeholder="Enter a strong password" 
                value={secretInput} 
                onChange={(e) => setSecretInput(e.target.value)}
              />
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleRegister} disabled={loading}>
            {loading ? 'Processing...' : 'Register Account'}
          </button>
        </section>
      )}

      {account && !fetchingProfile && userProfile?.isRegistered && (
        <main className="dashboard-grid">
          <div className="card animated">
            <div className="stat-label">Total Balance</div>
            <div className="stat-value">{Number(balance).toFixed(2)} VAMP</div>
            <div className="stat-label" style={{ color: '#8b5cf6', marginTop: '1rem' }}>Currently Staked</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{userProfile.totalStaked} VAMP</div>
          </div>

          <div className="card animated">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>New Stake</h3>
            <div className="input-group">
              <label>Amount to Stake (100 Days Lock)</label>
              <input 
                type="number" 
                placeholder="0.00" 
                value={stakeAmount} 
                onChange={(e) => setStakeAmount(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: '1rem', fontSize: '0.8rem', color: '#94a3b8' }}>
              ROI: 1% Daily | Total 200% Returns
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleStake} disabled={loading}>
              <Lock size={18} />
              {loading ? 'Approving...' : 'Stake Now'}
            </button>
          </div>

          <div className="card animated">
            <div className="stat-label">Referral Rewards</div>
            <div className="stat-value" style={{ color: '#22c55e' }}>{userProfile.referralRewards} VAMP</div>
            <button className="btn btn-outline" style={{ width: '100%' }} onClick={handleClaimReferral} disabled={loading}>
              <ArrowUpRight size={18} />
              Claim Referral Bonus
            </button>
          </div>

          <div className="card animated" style={{ gridColumn: '1 / -1' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History color="#8b5cf6" />
              Active Stakes
            </h3>
            <div className="stake-list">
              {stakes.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No stakes found.</div>
              ) : (
                stakes.map((s, idx) => (
                  <div key={idx} className="stake-item">
                    <div>
                      <div style={{ fontWeight: 600 }}>{s.amount} VAMP</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        Started: {new Date(s.startTime * 1000).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#22c55e', fontWeight: 600 }}>+{s.pendingReward} VAMP</div>
                      {s.withdrawn ? (
                        <span className="badge badge-success">Withdrawn</span>
                      ) : (
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                          onClick={() => handleWithdraw(s.index)}
                          disabled={loading}
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      )}

      {!account && (
        <section className="animated" style={{ textAlign: 'center', padding: '5rem 0' }}>
          <img src={logo} alt="VampExAI Logo" style={{ height: '120px', marginBottom: '2rem' }} />
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Earn 1% Daily Rewards</h1>
          <p style={{ color: '#94a3b8', maxWidth: '600px', margin: '0 auto 2rem' }}>
            Secure your VAMP tokens in the high-yield protocol. 100 days lock period with transparent blockchain verification.
          </p>
          <button className="btn btn-primary" style={{ margin: '0 auto', padding: '1rem 3rem' }} onClick={connectWallet}>
            Explore Dashboard
          </button>
        </section>
      )}

      <footer style={{ marginTop: '5rem', textAlign: 'center', color: '#475569', fontSize: '0.9rem' }}>
        © 2026 VampExAI Protocol. Powered by Blockchain Intelligence.
      </footer>
    </div>
  );
}

export default App;

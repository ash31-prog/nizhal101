"""NIZHAL · anomaly model.
Trains a small dense autoencoder on NORMAL behaviour only. We never train on
assault data (it does not exist, and faking it would be dishonest). Anything
the model cannot reconstruct is, by definition, behaviour this user does not
normally produce -> that is the anomaly signal.

Input : 9 behaviour features (motion, trajectory, audio, absence)
Arch  : 9 -> 5 -> 3 -> 5 -> 9, tanh, MSE, Adam, numpy only
Output: src/data/model.json  (weights, feature order, calibration)
"""
import numpy as np, json, os
rng = np.random.default_rng(7)
N = 24000
F = ['motionStruggle','motionFall','vehicleOnset','routeDivergence','speedAnomaly',
     'audioScream','noResponse','overdue','powerLoss']

def normal_batch(n):
    """Four honest modes of ordinary life. Each has its own signature."""
    out = []
    # 1. walking calmly
    k = n//4
    out.append(np.column_stack([
        np.abs(rng.normal(.12,.06,k)), np.abs(rng.normal(.03,.03,k)),
        np.abs(rng.normal(.02,.02,k)), np.abs(rng.normal(.06,.05,k)),
        np.abs(rng.normal(.08,.05,k)), np.abs(rng.normal(.04,.05,k)),
        np.zeros(k), np.zeros(k), np.zeros(k)]))
    # 2. riding a bus / auto (vehicle speed is normal here)
    out.append(np.column_stack([
        np.abs(rng.normal(.18,.08,k)), np.abs(rng.normal(.05,.04,k)),
        np.abs(rng.normal(.55,.15,k)), np.abs(rng.normal(.10,.07,k)),
        np.abs(rng.normal(.30,.12,k)), np.abs(rng.normal(.05,.05,k)),
        np.zeros(k), np.zeros(k), np.zeros(k)]))
    # 3. phone in pocket, jostling, running for the bus
    out.append(np.column_stack([
        np.abs(rng.normal(.34,.13,k)), np.abs(rng.normal(.12,.09,k)),
        np.abs(rng.normal(.06,.05,k)), np.abs(rng.normal(.14,.09,k)),
        np.abs(rng.normal(.42,.14,k)), np.abs(rng.normal(.08,.07,k)),
        np.zeros(k), np.zeros(k), np.zeros(k)]))
    # 4. stationary / at a desk / asleep, sometimes noisy room
    k2 = n - 3*k
    out.append(np.column_stack([
        np.abs(rng.normal(.03,.03,k2)), np.abs(rng.normal(.02,.03,k2)),
        np.abs(rng.normal(.01,.02,k2)), np.abs(rng.normal(.02,.03,k2)),
        np.abs(rng.normal(.02,.03,k2)), np.abs(rng.normal(.18,.16,k2)),
        np.zeros(k2), np.zeros(k2), np.zeros(k2)]))
    X = np.clip(np.vstack(out), 0, 1)
    rng.shuffle(X)
    return X

X = normal_batch(N)

# ---- tiny autoencoder, numpy + Adam -----------------------------------
sizes = [9, 5, 3, 5, 9]
W = [rng.normal(0, np.sqrt(2/sizes[i]), (sizes[i], sizes[i+1])) for i in range(4)]
B = [np.zeros(sizes[i+1]) for i in range(4)]
mW=[np.zeros_like(w) for w in W]; vW=[np.zeros_like(w) for w in W]
mB=[np.zeros_like(b) for b in B]; vB=[np.zeros_like(b) for b in B]
lr, b1, b2, eps = 3e-3, .9, .999, 1e-8

def fwd(x):
    a=[x]
    for i in range(4):
        z = a[-1]@W[i]+B[i]
        a.append(np.tanh(z) if i<3 else z)
    return a

step=0
for ep in range(260):
    perm = rng.permutation(len(X))
    for s in range(0, len(X), 256):
        xb = X[perm[s:s+256]]
        a = fwd(xb)
        d = 2*(a[-1]-xb)/len(xb)
        for i in reversed(range(4)):
            gW = a[i].T@d; gB = d.sum(0)
            if i>0: d = (d@W[i].T)*(1-a[i]**2)
            step+=1
            for g,p,m,v in ((gW,W,mW,vW),(gB,B,mB,vB)):
                m[i][:] = b1*m[i]+(1-b1)*g
                v[i][:] = b2*v[i]+(1-b2)*g*g
                p[i] -= lr*(m[i]/(1-b1**step))/(np.sqrt(v[i]/(1-b2**step))+eps)
    if ep%60==0:
        print('epoch',ep,'mse',float(((fwd(X)[-1]-X)**2).mean()))

err = ((fwd(X)[-1]-X)**2).mean(1)
p50,p95,p99 = np.percentile(err,[50,95,99])
print('train recon err  p50 %.5f  p95 %.5f  p99 %.5f' % (p50,p95,p99))

# ---- sanity: distress-like vectors must NOT reconstruct ----------------
tests = {
 'struggle in a bag'      : [.88,.45,.05,.30,.20,.10,0,0,0],
 'pulled into a vehicle'  : [.90,.30,.92,.86,.88,.30,1,0,0],
 'never arrived home'     : [.02,.02,.01,.10,.02,.02,0,.92,0],
 'phone forced off'       : [.30,.60,.05,.20,.10,.05,0,0,.95],
 '-- calm walk (normal)'  : [.12,.03,.02,.06,.08,.04,0,0,0],
 '-- bus ride  (normal)'  : [.18,.05,.55,.10,.30,.05,0,0,0],
}
cal = {}
for k,v in tests.items():
    x=np.array([v]); e=float(((fwd(x)[-1]-x)**2).mean())
    print('%-24s recon %.5f   anomaly %.2f' % (k, e, min(1, e/p99)))

json.dump({
  'features': F, 'sizes': sizes,
  'W': [w.round(5).tolist() for w in W],
  'B': [b.round(5).tolist() for b in B],
  'calib': {'p50': float(p50), 'p95': float(p95), 'p99': float(p99)},
  'trainedOn': 'normal behaviour only (walk / vehicle / jostle / stationary), 24000 samples',
  'note': 'no assault data was used, or needed',
}, open('src/data/model.json','w'))
print('wrote src/data/model.json', os.path.getsize('src/data/model.json')//1024, 'KB')

import math
W={'base':[6,8,9,9,8,7,4,6,5,6,6,6,6,6,4,4],'equal':[6.25]*16,
'startup':[12,6,10,8,6,7,4,8,2,2,4,5,8,10,6,2],'regulated':[3,10,7,10,9,5,2,5,10,11,9,7,3,4,1,4],'auton':[4,6,7,9,8,11,9,11,4,4,5,4,9,4,3,2]}
B={'aidlc':[2,4,3,5,4,4,3,4,3,3,2,3,5,3,2,3],'agilev':[3,2,3,5,4,4,3,2,3,4,3,2,4,4,5,2],'bmad':[5,4,3,4,4,4,3,3,3,3,2,2,4,3,2,3]}
cur=[2.1,3.2,3.2,3.2,2.4,2.4,1.8,1.6,2.8,3.2,1.8,2.1,4.0,2.7,3.6,1.6]
T=lambda s,p: sum(w*x/5 for w,x in zip(W[p],s))
def mix(base,upd): s=list(base); [s.__setitem__(k-1,v) for k,v in upd.items()]; return s
X={
'T0 core-only':mix(cur,{2:5,3:4,4:5,5:4,6:4,10:4,13:5}),
'T1 MVS':[3,5,4,5,4,4,3,3,4,4,3,3,5,3,4,3],
'T1 haircut':[3,4,4,4,4,4,3,3,4,4,3,3,5,3,4,3],
'T2 stretch':[5,5,5,5,5,5,4,4,5,5,5,4,5,5,5,4],
'T2 haircut':[4,5,4,5,4,5,4,4,4,4,4,4,5,4,5,4],
'T3 full':[5]*16}
def U(p,u=0.5): return math.sqrt(sum((w/5*u)**2 for w in W[p]))
for n,s in X.items():
    row=[]
    for p in W:
        bt=max(T(v,p) for v in B.values()); M=max(5,2*math.sqrt(U(p)**2+(3.1*U(p)/U('base'))**2))
        row.append(f"{p} {T(s,p):.1f} Δ{T(s,p)-bt:+.1f}/M{M:.1f}")
    print(n,'|',' | '.join(row))

import 'dart:math';
import 'package:flutter/material.dart';

class ExplodingNavItem extends StatefulWidget {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const ExplodingNavItem({
    super.key,
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  State<ExplodingNavItem> createState() => _ExplodingNavItemState();
}

class _ExplodingNavItemState extends State<ExplodingNavItem>
    with TickerProviderStateMixin {
  late AnimationController _popController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _popController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 150),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.8).animate(
      CurvedAnimation(parent: _popController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _popController.dispose();
    super.dispose();
  }

  void _handleTap(BuildContext context) {
    widget.onTap();
    
    // Play pop animation
    _popController.forward().then((_) {
      _popController.reverse();
    });

    // Trigger explosion in overlay
    _explode(context);
  }

  void _explode(BuildContext context) {
    final overlay = Overlay.of(context);
    final renderBox = context.findRenderObject() as RenderBox;
    final size = renderBox.size;
    final offset = renderBox.localToGlobal(Offset.zero);

    // Center of the icon
    final startX = offset.dx + size.width / 2;
    final startY = offset.dy + size.height / 2 - 10; // slightly above center

    late OverlayEntry entry;

    entry = OverlayEntry(
      builder: (context) {
        return ParticleExplosion(
          startX: startX,
          startY: startY,
          onComplete: () {
            entry.remove();
          },
        );
      },
    );

    overlay.insert(entry);
  }

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: () => _handleTap(context),
        behavior: HitTestBehavior.opaque,
        child: AnimatedBuilder(
          animation: _scaleAnimation,
          builder: (context, child) {
            return Transform.scale(
              scale: _scaleAnimation.value,
              child: child,
            );
          },
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                widget.isSelected ? widget.activeIcon : widget.icon,
                color: widget.isSelected ? Colors.teal : Colors.grey,
                size: 24,
              ),
              const SizedBox(height: 4),
              Text(
                widget.label,
                style: TextStyle(
                  fontSize: 12,
                  color: widget.isSelected ? Colors.teal : Colors.grey,
                  fontWeight: widget.isSelected ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class ParticleExplosion extends StatefulWidget {
  final double startX;
  final double startY;
  final VoidCallback onComplete;

  const ParticleExplosion({
    super.key,
    required this.startX,
    required this.startY,
    required this.onComplete,
  });

  @override
  State<ParticleExplosion> createState() => _ParticleExplosionState();
}

class _ParticleExplosionState extends State<ParticleExplosion>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  final List<Particle> _particles = [];
  final Random _random = Random();

  final List<IconData> _toolAssets = [
    Icons.build,
    Icons.handyman,
    Icons.plumbing,
    Icons.hardware,
    Icons.precision_manufacturing,
    Icons.carpenter,
  ];

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );

    // Generate 12-18 particles
    int count = 12 + _random.nextInt(7);
    for (int i = 0; i < count; i++) {
      // Explode outwards and upwards
      double angle = -pi + _random.nextDouble() * pi; 
      
      // Speed (velocity)
      double speed = 100 + _random.nextDouble() * 300; 
      
      _particles.add(Particle(
        assetPath: _toolAssets[_random.nextInt(_toolAssets.length)],
        vx: cos(angle) * speed,
        vy: sin(angle) * speed,
        rotationSpeed: (_random.nextDouble() - 0.5) * 10 * pi, 
        size: 10 + _random.nextDouble() * 15, // Confetti size
      ));
    }

    _controller.addListener(() {
      setState(() {});
    });

    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        widget.onComplete();
      }
    });

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    double t = _controller.value; 
    double gravity = 1200; // Gravity pull

    return Stack(
      clipBehavior: Clip.none,
      children: _particles.map((p) {
        double timeSec = t * 0.8; 
        
        double dx = p.vx * timeSec;
        double dy = p.vy * timeSec + 0.5 * gravity * timeSec * timeSec;

        double opacity = 1.0;
        if (t > 0.7) {
          opacity = (1.0 - t) / 0.3;
        }

        return Positioned(
          left: widget.startX + dx - p.size / 2,
          top: widget.startY + dy - p.size / 2,
          child: IgnorePointer(
            child: Opacity(
              opacity: opacity,
              child: Transform.rotate(
                angle: p.rotationSpeed * timeSec,
                child: Icon(
                  p.assetPath,
                  size: p.size,
                  color: Colors.blueGrey,
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class Particle {
  final IconData assetPath;
  final double vx;
  final double vy;
  final double rotationSpeed;
  final double size;

  Particle({
    required this.assetPath,
    required this.vx,
    required this.vy,
    required this.rotationSpeed,
    required this.size,
  });
}

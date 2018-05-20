#lang racket

;;  ! Functions for 2d drawing and transformation

(require lang/posn)

(struct pos (x y) #:transparent)

(define (move-pos a-pos a-direction a-speed)
  (define r (degrees->radians a-direction))
  (pos (+ (pos-x a-pos) (* a-speed (cos r)))
       (+ (pos-y a-pos) (* a-speed (sin r)))))

(define (add-direction-speeds d1 s1 d2 s2)
  ;; Given two direction & speed pairs, calculate the
  ;; combined effect and return new direction and speed
  (if (and (zero? s1) (zero? s2))
      (list d1 0)
      (let* ([vec1 (move-pos (pos 0 0) d1 s1)]
             [vec2 (move-pos (pos 0 0) d2 s2)]
             [c-vec (pos (+ (pos-x vec1) (pos-x vec2))
                         (+ (pos-y vec1) (pos-y vec2)))]
             [direction (radians->degrees
                         (atan (pos-y c-vec)
                               (pos-x c-vec)))]
             [speed (sqrt (+ (sqr (pos-x c-vec))
                             (sqr (pos-y c-vec))))])
        (list direction speed))))

(define (pos->posn points)
  (map (λ (p) (make-posn (pos-x p) (pos-y p)))
       points))

;; TODO -----------------------------------------------------------

(define (inside-circle? circle-pos radius a-pos)
  (define distance
    (sqrt (+ (expt (- (pos-x a-pos) (pos-x circle-pos)) 2)
             (expt (- (pos-y a-pos) (pos-y circle-pos)) 2))))
  (<= distance radius))

(define (between? a x y)
  "Is a between x and y?"
  (or (<= x a y)
      (>= x a y)))

(define (inside-rect? rpos1 rpos2 a-pos)
  "Is a-pos inside the rectangle defined by corners rpos1 and 2?"
  (and (between? (pos-x a-pos) (pos-x rpos1) (pos-x rpos2))
       (between? (pos-y a-pos) (pos-y rpos1) (pos-y rpos2))))

(define (direction-from-a-to-b pos1 pos2)
  "What's the direction/bearing from pos1 to pos2?"
  (let ([vector (pos (- (pos-x pos2) (pos-x pos1))
                      (- (pos-y pos2) (pos-y pos1)))])
    (radians->degrees
     (atan (pos-y vector) (pos-x vector)))))

(define (inside-triangle? points a-pos)
  "Is a-pos inside this triangle defined by the 3 points?"
  (let* ([angle1-2 (direction-from-a-to-b (first points) (second points))]
         [angle1-3 (direction-from-a-to-b (first points) (third points))]
         [angle1-a (direction-from-a-to-b (first points) a-pos)]
         [angle2-1 (direction-from-a-to-b (second points) (first points))]
         [angle2-3 (direction-from-a-to-b (second points) (third points))]
         [angle2-a (direction-from-a-to-b (second points) a-pos)])
    (and (between? angle1-a angle1-2 angle1-3)
         (between? angle2-a angle2-1 angle2-3))))

;; -----------------------------------------------------------

(provide pos pos-x pos-y pos->posn
         move-pos add-direction-speeds 
         between? inside-circle? inside-rect? inside-triangle?
direction-from-a-to-b)